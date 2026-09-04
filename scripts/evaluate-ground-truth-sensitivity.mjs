import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { evaluationSeeds } from '../eval/evaluate.mjs';

const rules = [
  'insufficient_funds_probability',
  'technical_probability',
  'issuer_declined_probability',
  'customer_action_probability',
  'salary_date_distribution',
  'outage_duration',
];
const scenarios = [{ name: 'baseline', perturbation: null }, ...rules.flatMap((rule) => [0.75, 1.25].map((factor) => ({ name: `${rule}_${factor}`, perturbation: { rule, factor } })) )];
const jobs = scenarios.flatMap((scenario) => ['UPI AutoPay', 'Cards'].flatMap((rail) => evaluationSeeds.map((seed) => ({ scenario, rail, seed }))));
const workerUrl = new URL('./ground-truth-sensitivity-worker.mjs', import.meta.url);

function runWorker(job) {
  return new Promise((resolveJob, rejectJob) => {
    const worker = new Worker(workerUrl, { workerData: job });
    worker.once('message', resolveJob);
    worker.once('error', rejectJob);
    worker.once('exit', (code) => { if (code !== 0) rejectJob(new Error(`${job.scenario.name}/${job.rail}/${job.seed} exited ${code}`)); });
  });
}

async function runPool(items, concurrency) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await runWorker(items[index]);
    }
  }));
  return results;
}

function spread(values) {
  return { mean: values.reduce((sum, value) => sum + value, 0) / values.length, min: Math.min(...values), max: Math.max(...values) };
}

const perSeed = await runPool(jobs, 10);
const summary = scenarios.flatMap((scenario) => ['UPI AutoPay', 'Cards'].map((rail) => {
  const rows = perSeed.filter((row) => row.scenario === scenario.name && row.rail === rail);
  return {
    scenario: scenario.name,
    perturbation: scenario.perturbation,
    rail,
    pairedNetDifference: spread(rows.map((row) => row.pairedNetDifference)),
    seedsWonByRecoveryLoop: rows.filter((row) => row.pairedNetDifference > 0).length,
    recoveryLoopNetRevenue: spread(rows.map((row) => row.recoveryLoopNetRevenue)),
    fixedLadderNetRevenue: spread(rows.map((row) => row.fixedLadderNetRevenue)),
  };
}));
const baselineByRail = Object.fromEntries(summary.filter((row) => row.scenario === 'baseline').map((row) => [row.rail, row]));
for (const row of summary) row.reversesBaselineSign = Math.sign(row.pairedNetDifference.mean) !== Math.sign(baselineByRail[row.rail].pairedNetDifference.mean);

const output = {
  generatedAt: new Date(Date.UTC(2026, 7, 22, 6)).toISOString(),
  design: 'One-at-a-time ±25% perturbations of each nonzero authored hidden-world rule group at the frozen three-day deferral cap. Permanent-zero rules remain zero under multiplicative perturbation.',
  rules,
  invariantZeroRules: ['mandate_inactive probability = 0', 'non_retryable probability = 0'],
  seeds: evaluationSeeds,
  cohortPerSeedPerRail: 2000,
  summary,
  perSeed,
};
const outputPath = resolve(dirname(fileURLToPath(import.meta.url)), '../data/evaluation/ground-truth-sensitivity.json');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
