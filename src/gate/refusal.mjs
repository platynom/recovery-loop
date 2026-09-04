import { attemptCapForRail, isMastercardHardStop } from '../policy/rail-rules.mjs';

export function applyRefusalGate(event, prediction, policy = {}) {
  const maxAttempts = attemptCapForRail(event.rail, policy);
  const coverageThreshold = policy.coverageThreshold ?? 0.28;
  const baseline = event.bankBaselineDeclineRate ?? 0.03;
  const declineDeviation = baseline > 0 ? event.bankDeclineRate / baseline : Number.POSITIVE_INFINITY;
  // Legacy intent was 12% current versus a 3% normal level = 4x. NPCI-mode
  // events carry the separately frozen incident-derived multiple (7.917882x).
  const maxDeclineDeviation = policy.maxDeclineDeviation ?? event.incidentDeviationMultiplier ?? 4;
  const reasons = [];
  const hardStopBlocked = event.issuerStop || isMastercardHardStop(event) || event.attemptNumber >= maxAttempts || !prediction.diagnosis.retryable;
  const outageBlocked = !policy.disableOutageGate && (event.outageActive || declineDeviation >= maxDeclineDeviation);
  const distributionBlocked = !policy.disableDistributionGate && prediction.probability < coverageThreshold;
  if (event.issuerStop) reasons.push('Issuer supplied a do-not-retry signal');
  if (isMastercardHardStop(event)) reasons.push(`Mastercard advice code ${event.merchantAdviceCode} prohibits retries`);
  if (!policy.disableOutageGate && event.outageActive) reasons.push(`${event.bank} ${event.rail} has an active outage`);
  if (event.attemptNumber >= maxAttempts) reasons.push(`${event.rail} attempt budget exhausted (${maxAttempts}/${maxAttempts})`);
  if (!policy.disableOutageGate && declineDeviation >= maxDeclineDeviation) reasons.push(`Bank decline rate is ${declineDeviation.toFixed(2)}x its ${(baseline * 100).toFixed(2)}% baseline (limit ${maxDeclineDeviation.toFixed(2)}x)`);
  if (!prediction.diagnosis.retryable) reasons.push(`${prediction.diagnosis.category} failures are not retryable`);
  if (!policy.disableDistributionGate && prediction.probability < coverageThreshold) reasons.push(`Recovery probability ${(prediction.probability * 100).toFixed(1)}% is below coverage threshold`);
  return { allowed: reasons.length === 0, reasons, blocks: { hardStop: hardStopBlocked, outage: outageBlocked, distribution: distributionBlocked } };
}
