import { runRecoverySimulation } from '../sim/generator.mjs';
import { predictRecovery } from '../src/predict/recovery.mjs';
import { baselines } from './baselines.mjs';

function summarize(name, events, attempts) {
  let attempted = 0; let recovered = 0; let revenue = 0; let outageWaste = 0;
  events.forEach((event, index) => {
    if (!attempts[index]) return;
    attempted += 1;
    if (event.outageActive) outageWaste += 1;
    const probability = predictRecovery(event, 24).probability;
    if (event.latentRecovery < probability) { recovered += 1; revenue += event.amount; }
  });
  return { name, attempts: attempted, recovered, revenue: Number(revenue.toFixed(2)), recoveryRate: attempted ? recovered / attempted : 0, rupeesPerAttempt: attempted ? revenue / attempted : 0, outageWaste };
}

function revenueAtBudget(events, attempts, budget) {
  const selected = events.map((event, index) => ({ event, attempted: attempts[index] })).filter((row) => row.attempted).slice(0, budget);
  return Number(selected.reduce((sum, { event }) => sum + (event.latentRecovery < predictRecovery(event, 24).probability ? event.amount : 0), 0).toFixed(2));
}

export function evaluatePolicies(options = {}) {
  const run = runRecoverySimulation(options);
  const attemptVectors = Object.fromEntries(Object.entries(baselines).map(([name, policy]) => [name, run.events.map(policy)]));
  attemptVectors['Recovery Loop'] = run.decisions.map((decision) => decision.action === 'retry');
  const rows = Object.entries(attemptVectors).map(([name, attempts]) => summarize(name, run.events, attempts));
  const fixedBudget = Math.min(...rows.filter((row) => row.attempts > 0).map((row) => row.attempts));
  rows.forEach((row) => { row.revenueAtFixedBudget = revenueAtBudget(run.events, attemptVectors[row.name], fixedBudget); });
  const riskCoverage = [0.15, 0.25, 0.35, 0.45, 0.55, 0.65].map((threshold) => {
    const covered = run.events.filter((event) => predictRecovery(event, 24).probability >= threshold);
    const correct = covered.filter((event) => event.latentRecovery < predictRecovery(event, 24).probability).length;
    return { threshold, coverage: covered.length / run.events.length, precision: covered.length ? correct / covered.length : 1 };
  });
  const calibration = Array.from({ length: 10 }, (_, bucket) => {
    const low = bucket / 10; const high = (bucket + 1) / 10;
    const members = run.events.filter((event) => { const p = predictRecovery(event, 24).probability; return p >= low && p < high; });
    return { range: `${low.toFixed(1)}–${high.toFixed(1)}`, count: members.length, predicted: members.length ? members.reduce((sum, event) => sum + predictRecovery(event, 24).probability, 0) / members.length : 0, observed: members.length ? members.filter((event) => event.latentRecovery < predictRecovery(event, 24).probability).length / members.length : 0 };
  });
  const outagePopulation = run.events.filter((event) => event.outageActive);
  const outageRefusals = run.decisions.filter((decision, index) => run.events[index].outageActive && decision.action !== 'retry');
  const counterfactualRecoverable = outagePopulation.filter((event) => event.latentRecovery < predictRecovery({ ...event, outageActive: false, bankDeclineRate: 0.03 }, 24).probability).length;
  const falseRefusals = run.decisions.map((decision, index) => ({ decision, event: run.events[index] })).filter(({ decision, event }) => decision.action === 'refuse' && event.latentRecovery < predictRecovery(event, 24).probability).slice(0, 10).map(({ decision, event }) => ({ eventId: event.id, bank: event.bank, category: event.errorCode, amount: event.amount, probability: decision.probability, reasons: decision.reasons }));
  return {
    generatedAt: new Date(options.now ?? Date.now()).toISOString(), sampleSize: run.events.length, fixedBudget, policies: rows, riskCoverage, calibration,
    censoringExperiment: { outagePopulation: outagePopulation.length, outageRefusals: outageRefusals.length, counterfactualRecoverable, note: 'Counterfactual removes the outage flag to expose recoverable payments hidden by safety refusal.' },
    falseRefusals,
    limitations: ['Synthetic events are grounded in documented categories, not merchant production data.', 'Recovery outcomes are deterministic simulation labels.', 'Replace with captured test-mode failures before making external performance claims.']
  };
}

if (process.argv[1]?.endsWith('evaluate.mjs')) console.log(JSON.stringify(evaluatePolicies({ count: 2000, seed: 20260822, outageBank: 'HDFC' }), null, 2));
