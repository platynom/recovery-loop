import { decideRecovery } from '../src/policy/scheduler.mjs';
import { createAuditEntry } from '../src/audit/audit.mjs';

const banks = ['HDFC', 'SBI', 'ICICI', 'Axis'];
const rails = ['UPI AutoPay', 'eMandate', 'Cards'];
const failures = [
  ['INSUFFICIENT_FUNDS', 'Insufficient funds in customer account'],
  ['GATEWAY_ERROR', 'Bank gateway temporarily unavailable'],
  ['PAYMENT_DECLINED', 'Payment declined by bank'],
  ['MANDATE_INACTIVE', 'Mandate inactive'],
  ['AUTHENTICATION_FAILED', 'Customer authentication failed'],
];

export function seededRandom(seed = 42) {
  let state = seed >>> 0;
  return () => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; };
}

export function generateFailureEvents(count = 250, options = {}) {
  const random = seededRandom(options.seed ?? 42);
  const outageBank = options.outageBank ?? null;
  const now = options.now ?? Date.UTC(2026, 7, 22, 6, 0, 0);
  return Array.from({ length: count }, (_, index) => {
    const bank = banks[Math.floor(random() * banks.length)];
    const rail = rails[Math.floor(random() * rails.length)];
    const failure = failures[Math.floor(random() * failures.length)];
    const outageActive = bank === outageBank;
    const createdAt = now - Math.floor(random() * 30 * 24 * 60 * 60 * 1000);
    const date = new Date(createdAt);
    return {
      id: `sim_${String(index + 1).padStart(4, '0')}`,
      createdAt,
      amount: Math.round((299 + random() * 4700) * 100) / 100,
      bank,
      rail,
      errorCode: failure[0],
      errorDescription: failure[1],
      attemptNumber: 1 + Math.floor(random() * 3),
      issuerStop: failure[0] === 'MANDATE_INACTIVE' || random() < 0.025,
      outageActive,
      bankDeclineRate: outageActive ? 0.32 + random() * 0.18 : 0.012 + random() * 0.07,
      hour: date.getUTCHours(),
      dayOfMonth: date.getUTCDate(),
      latentRecovery: random(),
    };
  });
}

export function runRecoverySimulation(options = {}) {
  const events = generateFailureEvents(options.count ?? 250, options);
  const operational = { monthlyBudget: options.monthlyBudget ?? 10000, remainingAttempts: options.remainingAttempts ?? 4200, maxAttempts: 3, coverageThreshold: options.coverageThreshold ?? 0.28, maxDeclineRate: 0.12 };
  const decisions = events.map((event) => decideRecovery(event, operational, options.now));
  const outcomes = decisions.map((decision, index) => {
    const event = events[index];
    const attempted = decision.action === 'retry';
    const recovered = attempted && event.latentRecovery < decision.probability;
    return { eventId: event.id, decisionId: decision.id, attempted, recovered, recoveredAmount: recovered ? event.amount : 0, attemptCost: attempted ? decision.attemptPrice : 0 };
  });
  const audits = decisions.map((decision, index) => createAuditEntry(events[index], decision, options.now));
  return { events, decisions, outcomes, audits };
}
