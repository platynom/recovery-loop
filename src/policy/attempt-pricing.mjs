const railCost = { 'UPI AutoPay': 8.4, eMandate: 10.2, Cards: 11.5 };

export function priceAttempt(event, operational = {}) {
  const base = railCost[event.rail] ?? 10;
  const scarcity = Math.max(0, 1 - (operational.remainingAttempts ?? 5000) / (operational.monthlyBudget ?? 10000));
  const outageRisk = Math.max(0, event.bankDeclineRate - 0.03) * 42;
  return Number((base + scarcity * 4.5 + outageRisk).toFixed(2));
}

export function expectedRecoveryValue(event, probability) {
  return Number((event.amount * probability).toFixed(2));
}
