import { POLICY_VERSION } from '../domain/types.mjs';
import { predictRecovery } from '../predict/recovery.mjs';
import { applyRefusalGate } from '../gate/refusal.mjs';
import { expectedRecoveryValue, priceAttempt } from './attempt-pricing.mjs';

const candidateHours = [2, 4, 8, 24, 48, 72];

export function decideRecovery(event, operational = {}, now = Date.now()) {
  const candidates = candidateHours.map((delayHours) => {
    const prediction = predictRecovery(event, delayHours);
    const attemptPrice = priceAttempt(event, operational);
    const expectedValue = expectedRecoveryValue(event, prediction.probability);
    return { delayHours, prediction, attemptPrice, expectedValue, surplus: expectedValue - attemptPrice };
  }).sort((a, b) => b.surplus - a.surplus);
  const best = candidates[0];
  const gate = applyRefusalGate(event, best.prediction, operational);
  if (!gate.allowed) {
    const waitable = !event.issuerStop && !['mandate_inactive', 'customer_action', 'fraud_risk'].includes(best.prediction.diagnosis.category);
    return { id: `dec_${event.id}`, eventId: event.id, action: waitable && (event.outageActive || event.bankDeclineRate >= 0.12) ? 'wait' : 'refuse', scheduledAt: waitable ? now + 6 * 60 * 60 * 1000 : null, probability: best.prediction.probability, attemptPrice: best.attemptPrice, expectedValue: best.expectedValue, reasons: gate.reasons, policyVersion: POLICY_VERSION };
  }
  if (best.surplus <= 0) {
    return { id: `dec_${event.id}`, eventId: event.id, action: 'refuse', scheduledAt: null, probability: best.prediction.probability, attemptPrice: best.attemptPrice, expectedValue: best.expectedValue, reasons: ['Expected recovery value does not cover the priced attempt'], policyVersion: POLICY_VERSION };
  }
  return { id: `dec_${event.id}`, eventId: event.id, action: 'retry', scheduledAt: now + best.delayHours * 60 * 60 * 1000, probability: best.prediction.probability, attemptPrice: best.attemptPrice, expectedValue: best.expectedValue, reasons: [`Best value window is ${best.delayHours} hours`, `Expected surplus ₹${best.surplus.toFixed(2)}`], policyVersion: POLICY_VERSION };
}
