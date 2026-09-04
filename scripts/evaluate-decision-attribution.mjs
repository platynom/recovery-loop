import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMainThread, parentPort, Worker, workerData } from 'node:worker_threads';
import { evaluatePolicyLifecycle } from '../eval/lifecycle.mjs';
import { evaluationSeeds } from '../eval/evaluate.mjs';
import { generateFailureEvents, recoveryOperational } from '../sim/generator.mjs';

const now = Date.UTC(2026, 7, 22, 6, 0, 0);
const rails = ['UPI AutoPay', 'Cards'];
const jobs = rails.flatMap((rail) => evaluationSeeds.map((seed) => ({ rail, seed })));

function publicMetrics(policy) {
  return {
    attempts: policy.attempts,
    recovered: policy.recovered,
    grossRevenue: policy.grossRevenue,
    netRevenue: policy.netRevenue,
    netRupeesPerAttempt: policy.netRupeesPerAttempt,
    strandedAttempts: policy.unusedAttemptsAtHorizon,
    decisionAttribution: policy.decisionAttribution,
    gateCounterfactuals: policy.gateCounterfactuals,
  };
}

function runJob({ rail, seed }) {
  const generation = { count: 2000, now, seed, rail, ...(rail === 'UPI AutoPay' ? { calibration: 'npci', outageBank: null } : {}) };
  const events = generateFailureEvents(2000, generation);
  const normalOperational = { ...recoveryOperational(generation), attemptBudgetMode: 'per-mandate' };
  const ablatedOperational = { ...normalOperational, disableOutageGate: true, disableDistributionGate: true };
  const normal = evaluatePolicyLifecycle('Recovery Loop', events, { now, operational: normalOperational, maxDeferralDays: 3 });
  const ablated = evaluatePolicyLifecycle('Recovery Loop', events, { now, operational: ablatedOperational, maxDeferralDays: 3 });
  const attributionTotal = Object.values(normal.decisionAttribution).reduce((sum, count) => sum + count, 0);
  if (attributionTotal !== normal.mandates.reduce((sum, mandate) => sum + mandate.decisionCauses.length, 0)) throw new Error(`Attribution mismatch for ${rail}/${seed}`);
  return {
    rail,
    seed,
    normal: publicMetrics(normal),
    gatesDisabled: publicMetrics(ablated),
    deltaWhenGatesDisabled: {
      attempts: ablated.attempts - normal.attempts,
      recovered: ablated.recovered - normal.recovered,
      grossRevenue: ablated.grossRevenue - normal.grossRevenue,
      netRevenue: ablated.netRevenue - normal.netRevenue,
      strandedAttempts: ablated.unusedAttemptsAtHorizon - normal.unusedAttemptsAtHorizon,
    },
  };
}

function spread(values) {
  return { mean: values.reduce((sum, value) => sum + value, 0) / values.length, min: Math.min(...values), max: Math.max(...values) };
}

if (!isMainThread) {
  parentPort.postMessage(runJob(workerData.job));
} else {
  const perSeed = await Promise.all(jobs.map((job) => new Promise((resolveJob, rejectJob) => {
    const worker = new Worker(new URL(import.meta.url), { workerData: { job } });
    worker.once('message', resolveJob);
    worker.once('error', rejectJob);
    worker.once('exit', (code) => { if (code !== 0) rejectJob(new Error(`${job.rail}/${job.seed} worker exited ${code}`)); });
  })));
  const summary = rails.map((rail) => {
    const rows = perSeed.filter((row) => row.rail === rail);
    const attribution = Object.fromEntries(['hardStop', 'outageGate', 'distributionGate', 'economic', 'retry'].map((cause) => [cause, spread(rows.map((row) => row.normal.decisionAttribution[cause]))]));
    const gateDecisions = rows.reduce((sum, row) => sum + row.normal.gateCounterfactuals.decisions, 0);
    const gateWouldRecover = rows.reduce((sum, row) => sum + row.normal.gateCounterfactuals.wouldRecover, 0);
    return {
      rail,
      attribution,
      gateCounterfactualPrecision: {
        decisions: gateDecisions,
        wouldRecover: gateWouldRecover,
        precision: gateDecisions ? gateWouldRecover / gateDecisions : null,
      },
      deltaWhenGatesDisabled: Object.fromEntries(['attempts', 'recovered', 'grossRevenue', 'netRevenue', 'strandedAttempts'].map((metric) => [metric, spread(rows.map((row) => row.deltaWhenGatesDisabled[metric]))])),
    };
  });
  const output = {
    generatedAt: new Date(now).toISOString(),
    experiment: 'Disable outage and distribution/novelty gates together; retain pricing, thresholds, outcome model, three-day cap, seeds, and cohorts.',
    seeds: evaluationSeeds,
    cohortPerSeedPerRail: 2000,
    summary,
    perSeed,
  };
  const outputPath = resolve(dirname(fileURLToPath(import.meta.url)), '../data/evaluation/decision-attribution-ablation.json');
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}
