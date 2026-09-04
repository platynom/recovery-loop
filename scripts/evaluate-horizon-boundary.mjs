import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMainThread, parentPort, Worker, workerData } from 'node:worker_threads';
import { evaluateNpcCalibratedRails, evaluatePerMandateRails, evaluationSeeds } from '../eval/evaluate.mjs';

const now = Date.UTC(2026, 7, 22, 6, 0, 0);
const jobs = [
  { rail: 'UPI AutoPay', maxDeferralDays: 3 },
  { rail: 'Cards', maxDeferralDays: 3 },
  { rail: 'UPI AutoPay', maxDeferralDays: 35 },
  { rail: 'Cards', maxDeferralDays: 35 },
];

function runJob(job) {
  const options = { count: 2000, seeds: evaluationSeeds, now, maxDeferralDays: job.maxDeferralDays };
  const rail = job.rail === 'UPI AutoPay'
    ? evaluateNpcCalibratedRails(options)[0]
    : evaluatePerMandateRails({ ...options, rails: ['Cards'] })[0];
  return { ...job, result: rail };
}

if (!isMainThread) {
  parentPort.postMessage(runJob(workerData.job));
} else {
  const runs = await Promise.all(jobs.map((job) => new Promise((resolveJob, rejectJob) => {
    const worker = new Worker(new URL(import.meta.url), { workerData: { job } });
    worker.once('message', resolveJob);
    worker.once('error', rejectJob);
    worker.once('exit', (code) => { if (code !== 0) rejectJob(new Error(`${job.rail}/${job.maxDeferralDays}d worker exited ${code}`)); });
  })));
  const representativeAttemptPriceTables = Object.fromEntries(runs
    .filter((run) => run.maxDeferralDays === 3)
    .map((run) => [run.rail, run.result.representativeOpportunityTable]));
  const output = {
    generatedAt: new Date(now).toISOString(),
    horizonDays: 30,
    boundaryRule: 'Mandate-local attempt price is exactly zero at days_left=0; no legal slot beyond the horizon is eligible.',
    seeds: evaluationSeeds,
    representativeAttemptPriceTables,
    runs,
  };
  const outputPath = resolve(dirname(fileURLToPath(import.meta.url)), '../data/evaluation/horizon-boundary.json');
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify(runs.map((run) => {
    const policy = run.result.policies.find((entry) => entry.name === 'Recovery Loop');
    return {
      rail: run.rail,
      maxDeferralDays: run.maxDeferralDays,
      mandatesReachedLastTwoDaysWithUnspentAttempts: policy.mandatesReachedLastTwoDaysWithUnspentAttempts,
      lastTwoDayRetryDecisions: policy.lastTwoDayRetryDecisions,
      lastTwoDayWaitDecisions: policy.lastTwoDayWaitDecisions,
      lastTwoDayTerminalRefusals: policy.lastTwoDayTerminalRefusals,
      strandedAttempts: policy.unusedAttemptsAtHorizon,
    };
  }), null, 2));
}
