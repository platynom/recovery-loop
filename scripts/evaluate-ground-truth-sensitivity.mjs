import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { authoredGroundTruthDefaults } from '../sim/outcomes.mjs';

const validationSeeds = [20260906, 20260907, 20260908, 20260909, 20260910, 20260911, 20260912, 20260913, 20260914, 20260915];
const factors = [0.75, 1.25];
const rules = [
  { id: 'salary_date_support', label: 'Salary-date support', currentValue: '[1, 5, 15, 25], equally likely', perturbationMeaning: 'multiply every support day by the factor, round, and clamp to days 1–30' },
  { id: 'salary_peak_probability', label: 'Salary-day recovery probability', currentValue: authoredGroundTruthDefaults.insufficientFundsSalaryPeak },
  { id: 'salary_daily_decay', label: 'First-three-days salary decay', currentValue: authoredGroundTruthDefaults.insufficientFundsSalaryDailyDecay, unit: 'probability points/day' },
  { id: 'post_salary_base_probability', label: 'Post-salary recovery base', currentValue: authoredGroundTruthDefaults.insufficientFundsPostSalaryBase },
  { id: 'post_salary_decay_days', label: 'Post-salary exponential decay constant', currentValue: authoredGroundTruthDefaults.insufficientFundsPostSalaryDecayDays, unit: 'days' },
  { id: 'insufficient_funds_floor', label: 'Insufficient-funds recovery floor', currentValue: authoredGroundTruthDefaults.insufficientFundsFloor },
  { id: 'technical_during_outage_probability', label: 'Technical recovery while outage is active', currentValue: authoredGroundTruthDefaults.technicalDuringOutage },
  { id: 'technical_after_clearance_probability', label: 'Technical recovery after outage clearance', currentValue: authoredGroundTruthDefaults.technicalAfterOutage },
  { id: 'issuer_declined_probability', label: 'Issuer-declined recovery probability', currentValue: authoredGroundTruthDefaults.issuerDeclinedRecovery },
  { id: 'authentication_failure_probability', label: 'Authentication-failure recovery probability', currentValue: authoredGroundTruthDefaults.authenticationFailureRecovery },
  { id: 'outage_duration', label: 'Active-outage duration', currentValue: '1.0 × NPCI monthly incident mean', status: 'NPCI aggregate duration; authored placement starts at evaluation time' },
  { id: 'failure_class_mix', label: 'Technical-versus-business failure-class odds', currentValue: '1.0 × each NPCI bank/month BD:TD mix', status: 'NPCI-backed input perturbation included to test the requested failure-class mix' },
  { id: 'mapped_hard_decline_share', label: 'NACH non-financial share mapped to hard decline', currentValue: '1.0 × published non-financial share', status: 'published partition; authored mapping to payment hardness' },
  { id: 'hard_subtype_issuer_weight', label: 'Hard-mix issuer-declined weight', currentValue: 12 },
  { id: 'hard_subtype_authentication_weight', label: 'Hard-mix authentication-failure weight', currentValue: 9 },
  { id: 'hard_subtype_mandate_inactive_weight', label: 'Hard-mix mandate-inactive weight', currentValue: 5 },
  { id: 'hard_subtype_non_retryable_weight', label: 'Hard-mix non-retryable weight', currentValue: 2 },
  { id: 'mandate_inactive_probability', label: 'Mandate-inactive recovery probability', currentValue: authoredGroundTruthDefaults.mandateInactiveRecovery, invariantUnderMultiplication: true },
  { id: 'non_retryable_probability', label: 'Non-retryable recovery probability', currentValue: authoredGroundTruthDefaults.nonRetryableRecovery, invariantUnderMultiplication: true },
];

const scenarios = [
  { name: 'baseline', perturbation: null },
  ...rules.flatMap((rule) => factors.map((factor) => ({
    name: `${rule.id}_${factor}`,
    rule: rule.id,
    factor,
    perturbation: { factors: { [rule.id]: factor } },
  }))),
];
const workerUrl = new URL('./ground-truth-sensitivity-worker.mjs', import.meta.url);
const outputPath = resolve(dirname(fileURLToPath(import.meta.url)), '../data/evaluation/ground-truth-sensitivity-14d-validation.json');

function runWorker(job) {
  return new Promise((resolveJob, rejectJob) => {
    const worker = new Worker(workerUrl, { workerData: job });
    worker.once('message', resolveJob);
    worker.once('error', rejectJob);
    worker.once('exit', (code) => { if (code !== 0) rejectJob(new Error(`${job.scenario.name}/${job.seed} exited ${code}`)); });
  });
}

async function runPool(items, concurrency = 10) {
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

function summarize(scenario, rows) {
  return {
    scenario: scenario.name,
    rule: scenario.rule ?? null,
    factor: scenario.factor ?? null,
    perturbation: scenario.perturbation,
    pairedNetDifference: spread(rows.map((row) => row.pairedNetDifference)),
    positiveSeeds: rows.filter((row) => row.pairedNetDifference > 0).length,
    perSeedPairedNetDifference: rows.map((row) => ({ seed: row.seed, difference: row.pairedNetDifference })),
    recoveryLoopNetRevenue: spread(rows.map((row) => row.recoveryLoopNetRevenue)),
    fixedLadderNetRevenue: spread(rows.map((row) => row.fixedLadderNetRevenue)),
  };
}

const prior = existsSync(outputPath) ? JSON.parse(readFileSync(outputPath, 'utf8')) : null;
const priorByScenario = new Map((prior?.summary ?? []).map((row) => [row.scenario, row]));
const pendingScenarios = scenarios.filter((scenario) => !priorByScenario.has(scenario.name));
const jobs = pendingScenarios.flatMap((scenario) => validationSeeds.map((seed) => ({ scenario, rail: 'UPI AutoPay', seed })));
const perSeed = await runPool(jobs);
const summary = scenarios.map((scenario) => priorByScenario.get(scenario.name)
  ?? summarize(scenario, perSeed.filter((row) => row.scenario === scenario.name)));
const baseline = summary.find((row) => row.scenario === 'baseline');
for (const row of summary) row.reversesBaselineSign = Math.sign(row.pairedNetDifference.mean) !== Math.sign(baseline.pairedNetDifference.mean);

const activeRules = rules.filter((rule) => !rule.invariantUnderMultiplication);
const leastFavourableFactors = Object.fromEntries(activeRules.map((rule) => {
  const candidates = summary.filter((row) => row.rule === rule.id);
  candidates.sort((a, b) => a.pairedNetDifference.mean - b.pairedNetDifference.mean || a.factor - b.factor);
  return [rule.id, candidates[0].factor];
}));
const combinedScenario = {
  name: 'combined_worst_case',
  rule: 'all_authored_rules',
  factor: null,
  perturbation: { factors: leastFavourableFactors },
};
const combinedRows = await runPool(validationSeeds.map((seed) => ({ scenario: combinedScenario, rail: 'UPI AutoPay', seed })));
const combinedWorstCase = summarize(combinedScenario, combinedRows);
combinedWorstCase.reversesBaselineSign = Math.sign(combinedWorstCase.pairedNetDifference.mean) !== Math.sign(baseline.pairedNetDifference.mean);

const signFlips = summary.filter((row) => row.rule && row.reversesBaselineSign);
const output = {
  generatedAt: new Date().toISOString(),
  design: 'UPI-only authored-ground-truth sensitivity at the frozen 14-day cap on the ten held-out validation seeds. Each listed rule is perturbed independently by -25% and +25%; policy parameters remain frozen.',
  rail: 'UPI AutoPay',
  maxDeferralDays: 14,
  seeds: validationSeeds,
  cohortPerSeed: 2000,
  rules,
  summary,
  signFlipsAtTwentyFivePercent: signFlips.map((row) => ({ rule: row.rule, factor: row.factor, pairedNetDifference: row.pairedNetDifference, positiveSeeds: row.positiveSeeds })),
  smallestTestedSignChangingPerturbation: signFlips.length ? 'At most 25%; only the registered ±25% points were evaluated.' : null,
  combinedWorstCase: {
    selectionMethod: 'For each non-invariant rule, use whichever of its independent ±25% rows produced the lower mean paired net difference; ties choose -25%.',
    factors: leastFavourableFactors,
    result: combinedWorstCase,
  },
  structuralAssumptionsNotMultiplicativelyPerturbed: [
    'NPCI months are sampled uniformly.',
    'An active incident is placed at evaluation time because NPCI does not publish incident timestamps.',
    'Each attempt succeeds when a seeded uniform draw is below the hidden probability.',
  ],
  note: 'This is a post-selection sensitivity analysis on the validation seeds, not a second confirmatory validation test.',
};
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ baseline, oneAtATime: summary.filter((row) => row.rule), combinedWorstCase: output.combinedWorstCase }, null, 2));
