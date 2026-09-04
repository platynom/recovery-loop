import { POLICY_VERSION } from '../domain/types.mjs';
import { predictRecovery } from '../predict/recovery.mjs';
import { applyRefusalGate } from '../gate/refusal.mjs';
import { expectedRecoveryValue, priceAttempt } from './attempt-pricing.mjs';
import { attemptCapForRail, isMastercardHardStop, legalAttemptTime } from './rail-rules.mjs';

const candidateHours = [2, 4, 8, 24, 48, 72];

export function decideRecovery(event, operational = {}, now = Date.now()) {
  const horizonAt = operational.evaluationHorizonAt;
  const proposedTimes = candidateHours.map((delayHours) => ({ delayHours, proposedAt: now + delayHours * 60 * 60 * 1000 }));
  const evaluateCandidate = ({ proposedAt }) => {
    const scheduledAt = legalAttemptTime(event, proposedAt, now);
    const effectiveDelayHours = (scheduledAt - now) / (60 * 60 * 1000);
    const prediction = predictRecovery(event, effectiveDelayHours);
    const attemptPrice = priceAttempt(event, operational, {
      decisionAt: now,
      candidateAt: scheduledAt,
      horizonAt: operational.evaluationHorizonAt,
      attemptsRemaining: operational.mandateAttemptsRemaining,
    });
    const expectedValue = expectedRecoveryValue(event, prediction.probability);
    return { delayHours: effectiveDelayHours, scheduledAt, prediction, attemptPrice, expectedValue, surplus: expectedValue - attemptPrice };
  };
  let candidates = proposedTimes.map(evaluateCandidate)
    .filter((candidate) => !Number.isFinite(horizonAt) || candidate.scheduledAt <= horizonAt);
  // Only when no normal future candidate fits do we consider spending a token
  // immediately. This prevents day-zero decisions from end-loading every retry
  // at the horizon while still giving a legal use-it-or-lose-it boundary action.
  if (!candidates.length && Number.isFinite(horizonAt) && now <= horizonAt) {
    const immediate = evaluateCandidate({ proposedAt: now });
    if (immediate.scheduledAt <= horizonAt) candidates = [immediate];
  }
  candidates.sort((a, b) => b.surplus - a.surplus);
  if (!candidates.length) {
    return { id: `dec_${event.id}`, eventId: event.id, action: 'refuse_terminal', cause: 'hard_stop', scheduledAt: null, probability: 0, attemptPrice: 0, expectedValue: 0, reasons: ['No legal retry slot remains inside the evaluation horizon'], policyVersion: POLICY_VERSION };
  }
  const best = candidates[0];
  const gate = applyRefusalGate(event, best.prediction, operational);
  const hardTerminal = event.issuerStop
    || isMastercardHardStop(event)
    || !best.prediction.diagnosis.retryable
    || event.attemptNumber >= attemptCapForRail(event.rail, operational)
    || (Number.isFinite(horizonAt) && now > horizonAt);
  if (!gate.allowed) {
    const cause = hardTerminal || gate.blocks.hardStop ? 'hard_stop' : gate.blocks.outage ? 'outage_gate' : 'distribution_gate';
    return { id: `dec_${event.id}`, eventId: event.id, action: cause === 'hard_stop' ? 'refuse_terminal' : 'wait', cause, scheduledAt: cause === 'hard_stop' ? null : now + 6 * 60 * 60 * 1000, counterfactualAttemptAt: best.scheduledAt, probability: best.prediction.probability, attemptPrice: best.attemptPrice, expectedValue: best.expectedValue, reasons: gate.reasons, policyVersion: POLICY_VERSION };
  }
  if (best.surplus <= 0) {
    return { id: `dec_${event.id}`, eventId: event.id, action: 'wait', cause: 'economic', scheduledAt: best.scheduledAt, probability: best.prediction.probability, attemptPrice: best.attemptPrice, expectedValue: best.expectedValue, reasons: ['Expected recovery value does not cover the priced attempt at this slot; re-evaluate later'], policyVersion: POLICY_VERSION };
  }
  return { id: `dec_${event.id}`, eventId: event.id, action: 'retry', cause: 'retry', scheduledAt: best.scheduledAt, probability: best.prediction.probability, attemptPrice: best.attemptPrice, expectedValue: best.expectedValue, reasons: [`Best value window is ${best.delayHours} hours`, `Expected surplus ₹${best.surplus.toFixed(2)}`], policyVersion: POLICY_VERSION };
}
