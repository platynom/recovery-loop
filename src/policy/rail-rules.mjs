const HOUR_MS = 60 * 60 * 1000;
const IST_OFFSET_MS = 5.5 * HOUR_MS;

export const railAttemptCaps = Object.freeze({
  'UPI AutoPay': 4,
  Cards: 4,
  eMandate: 3,
});

export const mastercardMinimumWaitHours = Object.freeze({
  '24': 1,
  '25': 24,
  '26': 48,
  '27': 96,
  '28': 144,
  '29': 192,
  '30': 240,
});

export const mastercardHardStops = new Set(['03', '21']);

export function attemptCapForRail(rail, policy = {}) {
  return policy.attemptCaps?.[rail] ?? railAttemptCaps[rail] ?? 3;
}

export function isMastercardHardStop(event) {
  return event.rail === 'Cards' && mastercardHardStops.has(String(event.merchantAdviceCode ?? '').padStart(2, '0'));
}

export function mastercardWaitFloorHours(event) {
  if (event.rail !== 'Cards') return 0;
  return mastercardMinimumWaitHours[String(event.merchantAdviceCode ?? '').padStart(2, '0')] ?? 0;
}

export function isUpiPeakWindow(timestamp) {
  const ist = new Date(timestamp + IST_OFFSET_MS);
  const minutes = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  return (minutes >= 10 * 60 && minutes < 13 * 60) || (minutes >= 17 * 60 && minutes < 21 * 60 + 30);
}

export function snapUpiOutOfPeak(timestamp) {
  if (!isUpiPeakWindow(timestamp)) return timestamp;
  const ist = new Date(timestamp + IST_OFFSET_MS);
  const minutes = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  if (minutes < 13 * 60) ist.setUTCHours(13, 0, 0, 0);
  else ist.setUTCHours(21, 30, 0, 0);
  return ist.getTime() - IST_OFFSET_MS;
}

export function legalAttemptTime(event, proposedAt, decisionAt = proposedAt) {
  const macFloor = decisionAt + mastercardWaitFloorHours(event) * HOUR_MS;
  // NPCI's observed NACH T+0..T+4 response bucket is an availability
  // constraint in calibrated simulations, not a policy parameter.
  const responseFloor = Number.isFinite(event.responseAvailableAt) ? event.responseAvailableAt : Number.NEGATIVE_INFINITY;
  const floored = Math.max(proposedAt, macFloor, responseFloor);
  return event.rail === 'UPI AutoPay' ? snapUpiOutOfPeak(floored) : floored;
}
