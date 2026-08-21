export function applyRefusalGate(event, prediction, policy = {}) {
  const maxAttempts = policy.maxAttempts ?? 3;
  const coverageThreshold = policy.coverageThreshold ?? 0.28;
  const maxDeclineRate = policy.maxDeclineRate ?? 0.12;
  const reasons = [];
  if (event.issuerStop) reasons.push('Issuer supplied a do-not-retry signal');
  if (event.outageActive) reasons.push(`${event.bank} ${event.rail} has an active outage`);
  if (event.attemptNumber >= maxAttempts) reasons.push(`Attempt budget exhausted (${maxAttempts}/${maxAttempts})`);
  if (event.bankDeclineRate >= maxDeclineRate) reasons.push(`Bank decline rate ${(event.bankDeclineRate * 100).toFixed(1)}% exceeds safety limit`);
  if (!prediction.diagnosis.retryable) reasons.push(`${prediction.diagnosis.category} failures are not retryable`);
  if (prediction.probability < coverageThreshold) reasons.push(`Recovery probability ${(prediction.probability * 100).toFixed(1)}% is below coverage threshold`);
  return { allowed: reasons.length === 0, reasons };
}
