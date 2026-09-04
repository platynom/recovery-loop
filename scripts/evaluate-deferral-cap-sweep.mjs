import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMainThread, parentPort, Worker, workerData } from 'node:worker_threads';
import { evaluateNpcCalibratedRails, evaluatePerMandateRails, evaluationSeeds } from '../eval/evaluate.mjs';

const now = Date.UTC(2026, 7, 22, 6, 0, 0);
const deferralCapsDays = [3, 7, 14, 21, 28, 30, 35];

function runRail(capDays, rail) {
  const options = { count: 2000, seeds: evaluationSeeds, now, maxDeferralDays: capDays };
  return rail === 'UPI AutoPay'
    ? evaluateNpcCalibratedRails(options)[0]
    : evaluatePerMandateRails({ ...options, rails: ['Cards'] })[0];
}

function evaluatePoint(capDays) {
  return {
    capDays,
    relationToHorizon: capDays < 30 ? 'binds before 30-day horizon' : capDays === 30 ? 'at 30-day horizon' : 'beyond 30-day horizon',
    rails: [runRail(capDays, 'UPI AutoPay'), runRail(capDays, 'Cards')],
  };
}

if (!isMainThread) {
  parentPort.postMessage(evaluatePoint(workerData.capDays));
} else {
const points = await Promise.all(deferralCapsDays.map((capDays) => new Promise((resolvePoint, rejectPoint) => {
  const worker = new Worker(new URL(import.meta.url), { workerData: { capDays } });
  worker.once('message', resolvePoint);
  worker.once('error', rejectPoint);
  worker.once('exit', (code) => { if (code !== 0) rejectPoint(new Error(`Cap ${capDays} worker exited with code ${code}`)); });
})));

const output = {
  generatedAt: new Date(now).toISOString(),
  measurement: 'Deferral-cap sensitivity sweep; no policy threshold, price, predictor, or outcome rule changed.',
  horizonDays: 30,
  deferralCapsDays,
  seeds: evaluationSeeds,
  cohortPerSeedPerRail: 2000,
  points,
};

const outputPath = resolve(dirname(fileURLToPath(import.meta.url)), '../data/evaluation/deferral-cap-sweep.json');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);

const compact = points.map((point) => ({
  capDays: point.capDays,
  rails: point.rails.map((rail) => {
    const recovery = rail.policies.find((policy) => policy.name === 'Recovery Loop');
    const ladder = rail.policies.find((policy) => policy.name === 'T+1 / T+2 / T+3');
    return {
      rail: rail.rail,
      recoveryLoop: {
        attempts: recovery.attempts.mean,
        recoveries: recovery.recovered.mean,
        grossRevenue: recovery.grossRevenue.mean,
        netRevenue: recovery.netRevenue.mean,
        netRupeesPerAttempt: recovery.netRupeesPerAttempt.mean,
        strandedAttempts: recovery.unusedAttemptsAtHorizon.mean,
        deferralCapHits: recovery.deferralCapHits.mean,
      },
      fixedLadder: {
        attempts: ladder.attempts.mean,
        recoveries: ladder.recovered.mean,
        grossRevenue: ladder.grossRevenue.mean,
        netRevenue: ladder.netRevenue.mean,
        netRupeesPerAttempt: ladder.netRupeesPerAttempt.mean,
        strandedAttempts: ladder.unusedAttemptsAtHorizon.mean,
        deferralCapHits: ladder.deferralCapHits.mean,
      },
      pairedNetDifference: rail.pairedNetDifference,
      seedsWonByRecoveryLoop: rail.seedsWonByRecoveryLoop,
    };
  }),
}));
console.log(JSON.stringify(compact, null, 2));
}
