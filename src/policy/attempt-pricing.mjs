import { baseAttemptPrice, mandateOpportunityPrice } from './mandate-opportunity.mjs';

export function priceAttempt(event, operational = {}, context = {}) {
  if (operational.attemptBudgetMode === 'per-mandate') {
    return mandateOpportunityPrice(event, { ...context, operational });
  }
  const base = baseAttemptPrice(event);
  const scarcity = Math.max(0, 1 - (operational.remainingAttempts ?? 5000) / (operational.monthlyBudget ?? 10000));
  return Number((base + scarcity * 4.5).toFixed(2));
}

export function expectedRecoveryValue(event, probability) {
  return Number((event.amount * probability).toFixed(2));
}
