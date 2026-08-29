import { decideRecovery } from '../src/policy/scheduler.mjs';
import { createAuditEntry } from '../src/audit/audit.mjs';
import { diagnoseFailure } from '../src/diagnose/taxonomy.mjs';
import taxonomy from '../data/failure_taxonomy.json' with { type: 'json' };
import { registerHiddenWorld, simulateAttempt } from './outcomes.mjs';
import { sampleNpcFailure } from './npci-calibration.mjs';

const banks = ['HDFC', 'SBI', 'ICICI', 'Axis'];
const rails = ['UPI AutoPay', 'eMandate', 'Cards'];
const DAY_MS = 24 * 60 * 60 * 1000;
const cardAdviceByCategory = Object.freeze({
  technical: '24',
  insufficient_funds: '25',
  issuer_declined: '26',
  customer_action: '03',
  mandate_inactive: '21',
  non_retryable: '03',
});

// The declared mix is 42% insufficient funds, 30% technical/timeout,
// 12% issuer decline, 9% customer action, 5% inactive mandate, and 2%
// permanent configuration rejection. Insufficient funds plus technical make
// up 72% because they dominate the Indian subscription-decline scenario in
// the evaluation brief; these are simulation assumptions, not production data.
const failureCases = taxonomy.tuples.filter((entry) => entry.simulation?.weight > 0);
const totalFailureWeight = failureCases.reduce((sum, entry) => sum + entry.simulation.weight, 0);

function weightedFailure(random) {
  let cursor = random() * totalFailureWeight;
  for (const failure of failureCases) {
    cursor -= failure.simulation.weight;
    if (cursor < 0) return failure;
  }
  return failureCases.at(-1);
}

function failureForCategory(category) {
  const failure = failureCases.find((entry) => entry.category === category);
  if (!failure) throw new Error(`No taxonomy simulation tuple for NPCI category ${category}`);
  return failure;
}

export function seededRandom(seed = 42) {
  let state = seed >>> 0;
  return () => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; };
}

export function generateFailureEvents(count = 250, options = {}) {
  const random = seededRandom(options.seed ?? 42);
  const outageBank = options.outageBank ?? null;
  const now = options.now ?? Date.UTC(2026, 7, 22, 6, 0, 0);
  return Array.from({ length: count }, (_, index) => {
    const rail = options.rail ?? rails[Math.floor(random() * rails.length)];
    const npc = options.calibration === 'npci' ? sampleNpcFailure(rail, random, now) : null;
    const bank = npc?.bank ?? banks[Math.floor(random() * banks.length)];
    const failure = npc ? failureForCategory(npc.category) : weightedFailure(random);
    const outageActive = npc?.outageActive ?? bank === outageBank;
    const createdAt = now - Math.floor(random() * 30 * 24 * 60 * 60 * 1000);
    const date = new Date(createdAt);
    const errorReason = failure.simulation.error_reason ?? failure.error_reason;
    const event = {
      id: `sim_${String(index + 1).padStart(4, '0')}`,
      createdAt,
      amount: Math.round((299 + random() * 4700) * 100) / 100,
      bank,
      rail,
      errorCode: failure.simulation.error_code,
      errorDescription: failure.simulation.error_description,
      errorSource: failure.error_source,
      errorStep: failure.error_step,
      errorReason,
      mandateId: `mandate_${String(index + 1).padStart(4, '0')}`,
      merchantAdviceCode: rail === 'Cards' ? cardAdviceByCategory[failure.category] ?? '' : '',
      attemptNumber: 1,
      // The legacy 2.5% issuer-stop rate is an explicit synthetic assumption.
      // NPCI-calibrated runs add no undocumented stop rate.
      issuerStop: failure.category === 'mandate_inactive' || (!npc && random() < 0.025),
      outageActive,
      bankDeclineRate: npc?.bankDeclineRate ?? (outageActive ? 0.32 + random() * 0.18 : 0.012 + random() * 0.07),
      bankBaselineDeclineRate: npc?.bankBaselineDeclineRate ?? 0.03,
      normalBankDeclineRate: npc?.normalBankDeclineRate,
      bankDeclineDeviation: npc?.bankDeclineDeviation,
      incidentDeviationMultiplier: npc?.incidentDeviationMultiplier ?? 4,
      hour: date.getUTCHours(),
      dayOfMonth: date.getUTCDate(),
      calibrationPeriod: npc?.period,
      calibrationSource: npc ? 'NPCI published monthly aggregate' : 'synthetic assumption',
      responseLagDays: npc?.responseLagDays,
      responseAvailableAt: npc?.responseAvailableAt,
    };
    const diagnosis = diagnoseFailure(event);
    if (diagnosis.category === 'unknown' || diagnosis.source === 'unmapped-tuple') {
      throw new Error(`Generated event ${event.id} has unmapped tuple ${event.errorSource}/${event.errorStep}/${event.errorReason}`);
    }
    const outageClearsAt = npc?.outageClearsAt ?? (outageActive
      ? failure.category === 'technical'
        ? now + (6 + Math.floor(random() * 43)) * 60 * 60 * 1000
        : now + DAY_MS
      : now - DAY_MS);
    registerHiddenWorld(event, {
      category: diagnosis.category,
      salaryDay: [1, 5, 15, 25][Math.floor(random() * 4)],
      outageClearsAt,
      outcomeDraws: Array.from({ length: 8 }, () => random()),
    });
    return event;
  });
}

export function runRecoverySimulation(options = {}) {
  const now = options.now ?? Date.UTC(2026, 7, 22, 6, 0, 0);
  const events = generateFailureEvents(options.count ?? 250, { ...options, now });
  const operational = recoveryOperational(options);
  const decisions = events.map((event) => decideRecovery(event, operational, now));
  const outcomes = decisions.map((decision, index) => {
    const event = events[index];
    const result = simulateAttempt(event, decision.action === 'retry' ? decision.scheduledAt : null);
    return { ...result, eventId: event.id, decisionId: decision.id, attemptCost: result.attempted ? decision.attemptPrice : 0 };
  });
  const audits = decisions.map((decision, index) => createAuditEntry(events[index], decision, options.now));
  return { events, decisions, outcomes, audits };
}

export function recoveryOperational(options = {}) {
  return { monthlyBudget: options.monthlyBudget ?? 10000, remainingAttempts: options.remainingAttempts ?? 4200, coverageThreshold: options.coverageThreshold ?? 0.28, maxDeclineRate: 0.12, attemptCaps: options.attemptCaps };
}
