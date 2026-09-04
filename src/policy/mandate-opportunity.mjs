import { predictRecovery } from '../predict/recovery.mjs';
import { attemptCapForRail } from './rail-rules.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const railCost = { 'UPI AutoPay': 8.4, eMandate: 10.2, Cards: 11.5 };

export function baseAttemptPrice(event) {
  const base = railCost[event.rail] ?? 10;
  const outageRisk = Math.max(0, event.bankDeclineRate - 0.03) * 42;
  return base + outageRisk;
}

function observableFutureEvent(event, attemptedAt, attemptNumber) {
  const date = new Date(attemptedAt);
  return { ...event, attemptNumber, hour: date.getUTCHours(), dayOfMonth: date.getUTCDate() };
}

export function buildMandateOpportunityTable(event, context = {}) {
  const decisionAt = context.decisionAt ?? Date.now();
  const candidateAt = context.candidateAt ?? decisionAt;
  const horizonAt = Math.max(candidateAt, context.horizonAt ?? candidateAt);
  const cap = attemptCapForRail(event.rail, context.operational);
  const attemptsRemaining = Math.max(0, Math.min(3, context.attemptsRemaining ?? cap - event.attemptNumber));
  const slots = [];
  for (let attemptedAt = candidateAt; attemptedAt <= horizonAt; attemptedAt += DAY_MS) slots.push(attemptedAt);

  const values = Array.from({ length: slots.length + 1 }, () => Array(attemptsRemaining + 1).fill(0));
  const opportunities = Array.from({ length: slots.length }, () => Array(attemptsRemaining + 1).fill(0));
  for (let slot = slots.length - 1; slot >= 0; slot -= 1) {
    for (let remaining = 1; remaining <= attemptsRemaining; remaining += 1) {
      const attemptedAt = slots[slot];
      const attemptNumber = cap - remaining;
      const futureEvent = observableFutureEvent(event, attemptedAt, attemptNumber);
      const delayHours = Math.max(0, (attemptedAt - decisionAt) / HOUR_MS);
      const probability = predictRecovery(futureEvent, delayHours).probability;
      const networkCost = baseAttemptPrice(futureEvent);
      const continuationAfterFailure = values[slot + 1][remaining - 1];
      const waitValue = values[slot + 1][remaining];
      const attemptValue = probability * event.amount - networkCost + (1 - probability) * continuationAfterFailure;
      values[slot][remaining] = Math.max(waitValue, attemptValue);
      opportunities[slot][remaining] = Math.max(0, waitValue - (1 - probability) * continuationAfterFailure);
    }
  }

  const rows = slots.map((attemptedAt, slot) => ({
    daysRemaining: Math.floor((horizonAt - attemptedAt) / DAY_MS),
    attemptedAt,
    valueByAttemptsRemaining: values[slot].map((value) => Number(value.toFixed(2))),
    opportunityCostByAttemptsRemaining: opportunities[slot].map((value) => Number(value.toFixed(2))),
    attemptPriceByAttemptsRemaining: opportunities[slot].map((opportunityCost, remaining) => {
      if (remaining === 0) return 0;
      // A mandate-local token has no continuation value at the horizon. The
      // boundary price is therefore zero: use the token now or lose it.
      if (attemptedAt >= horizonAt) return 0;
      return Number((baseAttemptPrice(observableFutureEvent(event, attemptedAt, cap - remaining)) + opportunityCost).toFixed(2));
    }),
  }));
  return { attemptsRemaining, candidateAt, horizonAt, rows };
}

export function mandateOpportunityPrice(event, context = {}) {
  const table = buildMandateOpportunityTable(event, context);
  return table.rows[0]?.attemptPriceByAttemptsRemaining[table.attemptsRemaining] ?? 0;
}
