import { diagnoseFailure } from '../diagnose/taxonomy.mjs';

const categoryBase = {
  technical: 0.72,
  insufficient_funds: 0.48,
  issuer_declined: 0.18,
  mandate_inactive: 0.04,
  customer_action: 0.08,
  fraud_risk: 0.01,
  non_retryable: 0,
  unknown: 0,
};

const bankAdjustments = { HDFC: 0.03, ICICI: 0.04, SBI: -0.02, Axis: 0.01 };

function clamp(value, min = 0.01, max = 0.95) { return Math.min(max, Math.max(min, value)); }

export function predictRecovery(event, delayHours = 4) {
  const diagnosis = diagnoseFailure(event);
  if (!diagnosis.retryable) {
    return { probability: 0, diagnosis, modelVersion: 'calibrated-simulator/1.0.0' };
  }
  let probability = categoryBase[diagnosis.category] ?? categoryBase.unknown;
  probability += bankAdjustments[event.bank] ?? 0;
  probability -= Math.max(0, event.attemptNumber - 1) * 0.11;
  probability -= Math.max(0, event.bankDeclineRate - 0.04) * 1.9;
  if (diagnosis.category === 'insufficient_funds') {
    const nearSalary = event.dayOfMonth <= 3 || event.dayOfMonth >= 28;
    probability += nearSalary ? 0.19 : 0;
    probability += delayHours >= 24 ? 0.08 : -0.04;
  }
  if (diagnosis.category === 'technical') probability += delayHours >= 2 && delayHours <= 8 ? 0.08 : 0;
  if (event.outageActive) probability *= 0.12;
  if (event.issuerStop) probability = 0.01;
  return { probability: Number(clamp(probability).toFixed(4)), diagnosis, modelVersion: 'calibrated-simulator/1.0.0' };
}
