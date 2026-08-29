import { POLICY_VERSION } from '../domain/types.mjs';
import { predictRecovery } from '../predict/recovery.mjs';
import { applyRefusalGate } from '../gate/refusal.mjs';
import { expectedRecoveryValue, priceAttempt } from './attempt-pricing.mjs';
import { attemptCapForRail, isMastercardHardStop, legalAttemptTime } from './rail-rules.mjs';

const candidateHours = [2, 4, 8, 24, 48, 72];

export function decideRecovery(event, operational = {}, now = Date.now()) {
  const candidates = candidateHours.map((delayHours) => {
    const proposedAt = now + delayHours * 60 * 60 * 1000;
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
  }).sort((a, b) => b.surplus - a.surplus);
  const best = candidates[0];
  const gate = applyRefusalGate(event, best.prediction, operational);
  const horizonAt = operational.evaluationHorizonAt;
  const hardTerminal = event.issuerStop
    || isMastercardHardStop(event)
    || !best.prediction.diagnosis.retryable
    || event.attemptNumber >= attemptCapForRail(event.rail, operational)
    || (Number.isFinite(horizonAt) && now >= horizonAt);
  if (!gate.allowed) {
    return { id: `dec_${event.id}`, eventId: event.id, action: hardTerminal ? 'refuse_terminal' : 'wait', scheduledAt: hardTerminal ? null : now + 6 * 60 * 60 * 1000, probability: best.prediction.probability, attemptPrice: best.attemptPrice, expectedValue: best.expectedValue, reasons: gate.reasons, policyVersion: POLICY_VERSION };
  }
  if (best.surplus <= 0) {
    return { id: `dec_${event.id}`, eventId: event.id, action: 'wait', scheduledAt: best.scheduledAt, probability: best.prediction.probability, attemptPrice: best.attemptPrice, expectedValue: best.expectedValue, reasons: ['Expected recovery value does not cover the priced attempt at this slot; re-evaluate later'], policyVersion: POLICY_VERSION };
  }
  return { id: `dec_${event.id}`, eventId: event.id, action: 'retry', scheduledAt: best.scheduledAt, probability: best.prediction.probability, attemptPrice: best.attemptPrice, expectedValue: best.expectedValue, reasons: [`Best value window is ${best.delayHours} hours`, `Expected surplus ₹${best.surplus.toFixed(2)}`], policyVersion: POLICY_VERSION };
}
