import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMainThread, parentPort, Worker, workerData } from 'node:worker_threads';
import { diagnoseFailure } from '../src/diagnose/taxonomy.mjs';
import { evaluatePolicyLifecycle, declinePenaltyRupees, declinePenaltyThreshold } from '../eval/lifecycle.mjs';
import { evaluationSeeds } from '../eval/evaluate.mjs';
import { generateFailureEvents, recoveryOperational, seededRandom } from '../sim/generator.mjs';

const now = Date.UTC(2026, 7, 22, 6, 0, 0);
const targetAction = 'Recovery Loop';
const controlAction = 'T+1 / T+2 / T+3';
const targetPropensity = 0.5;
const metrics = ['grossRevenue', 'attemptCost', 'stopSignalPenalty', 'retryAttempts', 'failures'];
const jobs = ['UPI AutoPay', 'Cards'].flatMap((rail) => evaluationSeeds.map((seed) => ({ rail, seed })));

function outcomeFromMandate(mandate) {
  return {
    grossRevenue: mandate.recoveredAmount,
    attemptCost: mandate.attemptCost,
    stopSignalPenalty: mandate.stopSignalPenalty,
    retryAttempts: mandate.retryAttempts,
    failures: mandate.failures,
  };
}

function observableKey(event) {
  return {
    category: diagnoseFailure(event).category,
    bank: event.bank,
    amountBand: Math.floor(event.amount / 1000),
  };
}

function buildOutcomeModel(training) {
  const cells = new Map();
  const categories = new Map();
  const global = Object.fromEntries(metrics.map((metric) => [metric, { sum: 0, count: 0 }]));
  for (const row of training) {
    const exactKey = `${row.features.category}|${row.features.bank}|${row.features.amountBand}`;
    if (!cells.has(exactKey)) cells.set(exactKey, Object.fromEntries(metrics.map((metric) => [metric, { sum: 0, count: 0 }])));
    if (!categories.has(row.features.category)) categories.set(row.features.category, Object.fromEntries(metrics.map((metric) => [metric, { sum: 0, count: 0 }])));
    for (const metric of metrics) {
      for (const bucket of [cells.get(exactKey)[metric], categories.get(row.features.category)[metric], global[metric]]) {
        bucket.sum += row.outcome[metric];
        bucket.count += 1;
      }
    }
  }
  return (features, metric) => {
    const exact = cells.get(`${features.category}|${features.bank}|${features.amountBand}`)?.[metric];
    if (exact?.count >= 5) return exact.sum / exact.count;
    const category = categories.get(features.category)?.[metric];
    if (category?.count >= 5) return category.sum / category.count;
    return global[metric].count ? global[metric].sum / global[metric].count : 0;
  };
}

function totalsToValue(totals) {
  const declineRate = totals.retryAttempts > 0 ? totals.failures / totals.retryAttempts : 0;
  const declinePenalty = totals.retryAttempts > 0 && declineRate > declinePenaltyThreshold ? declinePenaltyRupees : 0;
  return {
    ...totals,
    declineRate,
    declinePenalty,
    netRevenue: totals.grossRevenue - totals.attemptCost - totals.stopSignalPenalty - declinePenalty,
  };
}

function estimateIpw(loggedRows) {
  const totals = Object.fromEntries(metrics.map((metric) => [metric, loggedRows.reduce((sum, row) => sum + (row.action === targetAction ? row.outcome[metric] / row.propensity : 0), 0)]));
  return totalsToValue(totals);
}

function estimateDr(loggedRows) {
  const models = [0, 1].map((fold) => buildOutcomeModel(loggedRows.filter((row) => row.fold !== fold && row.action === targetAction)));
  const totals = Object.fromEntries(metrics.map((metric) => [metric, loggedRows.reduce((sum, row) => {
    const predictedTarget = models[row.fold](row.features, metric);
    const correction = row.action === targetAction ? (row.outcome[metric] - predictedTarget) / row.propensity : 0;
    return sum + predictedTarget + correction;
  }, 0)]));
  return totalsToValue(totals);
}

function runJob({ rail, seed }) {
  const generation = { count: 2000, now, seed, rail, ...(rail === 'UPI AutoPay' ? { calibration: 'npci', outageBank: null } : {}) };
  const events = generateFailureEvents(2000, generation);
  const operational = { ...recoveryOperational(generation), attemptBudgetMode: 'per-mandate' };
  const target = evaluatePolicyLifecycle(targetAction, events, { now, operational, maxDeferralDays: 3 });
  const control = evaluatePolicyLifecycle(controlAction, events, { now, operational, maxDeferralDays: 3 });
  const loggingRandom = seededRandom(seed ^ 0x5f3759df);
  const loggedRows = events.map((event, index) => {
    const action = loggingRandom() < targetPropensity ? targetAction : controlAction;
    const mandate = action === targetAction ? target.mandates[index] : control.mandates[index];
    return {
      rail,
      seed,
      eventId: event.id,
      action,
      propensity: targetPropensity,
      fold: index % 2,
      features: observableKey(event),
      outcome: outcomeFromMandate(mandate),
    };
  });
  const onPolicy = {
    grossRevenue: target.grossRevenue,
    attemptCost: target.attemptCost,
    stopSignalPenalty: target.stopSignalPenalty,
    retryAttempts: target.attempts,
    failures: target.failures - events.length,
    declineRate: target.declineRate,
    declinePenalty: target.declinePenalty,
    netRevenue: target.netRevenue,
  };
  return { rail, seed, loggingCounts: { target: loggedRows.filter((row) => row.action === targetAction).length, control: loggedRows.filter((row) => row.action === controlAction).length }, onPolicy, ipw: estimateIpw(loggedRows), doublyRobust: estimateDr(loggedRows), loggedRows };
}

function spread(values) {
  return { mean: values.reduce((sum, value) => sum + value, 0) / values.length, min: Math.min(...values), max: Math.max(...values) };
}

if (!isMainThread) {
  parentPort.postMessage(runJob(workerData.job));
} else {
  const runs = await Promise.all(jobs.map((job) => new Promise((resolveJob, rejectJob) => {
    const worker = new Worker(new URL(import.meta.url), { workerData: { job } });
    worker.once('message', resolveJob);
    worker.once('error', rejectJob);
    worker.once('exit', (code) => { if (code !== 0) rejectJob(new Error(`${job.rail}/${job.seed} worker exited ${code}`)); });
  })));
  const summary = ['UPI AutoPay', 'Cards'].map((rail) => {
    const rows = runs.filter((run) => run.rail === rail);
    return {
      rail,
      onPolicyNetRevenue: spread(rows.map((row) => row.onPolicy.netRevenue)),
      ipwNetRevenue: spread(rows.map((row) => row.ipw.netRevenue)),
      doublyRobustNetRevenue: spread(rows.map((row) => row.doublyRobust.netRevenue)),
      ipwGapFromOnPolicy: spread(rows.map((row) => row.ipw.netRevenue - row.onPolicy.netRevenue)),
      doublyRobustGapFromOnPolicy: spread(rows.map((row) => row.doublyRobust.netRevenue - row.onPolicy.netRevenue)),
      targetAssignments: spread(rows.map((row) => row.loggingCounts.target)),
    };
  });
  const output = {
    generatedAt: new Date(now).toISOString(),
    design: {
      unit: 'mandate lifecycle trajectory',
      loggingActions: [targetAction, controlAction],
      propensities: { [targetAction]: targetPropensity, [controlAction]: 1 - targetPropensity },
      estimator: 'Trajectory-level IPW and two-fold cross-fitted doubly robust estimation. The outcome regression uses observable failure category, bank, and fixed ₹1,000 amount bands with exact-cell n>=5, then category and global fallbacks.',
      caveat: 'This is off-policy estimation inside the authored simulator, not evidence from merchant production logs.',
    },
    seeds: evaluationSeeds,
    cohortPerSeedPerRail: 2000,
    summary,
    perSeed: runs.map((run) => Object.fromEntries(Object.entries(run).filter(([key]) => key !== 'loggedRows'))),
  };
  const directory = resolve(dirname(fileURLToPath(import.meta.url)), '../data/evaluation');
  mkdirSync(directory, { recursive: true });
  writeFileSync(resolve(directory, 'off-policy-estimation.json'), `${JSON.stringify(output, null, 2)}\n`);
  writeFileSync(resolve(directory, 'off-policy-logged-actions.jsonl'), `${runs.flatMap((run) => run.loggedRows).map((row) => JSON.stringify(row)).join('\n')}\n`);
  console.log(JSON.stringify(summary, null, 2));
}
