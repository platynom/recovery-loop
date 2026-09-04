import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMainThread, parentPort, Worker, workerData } from 'node:worker_threads';
import { evaluateNpcCalibratedRails, evaluatePerMandateRails } from '../eval/evaluate.mjs';

const now = Date.UTC(2026, 7, 22, 6, 0, 0);
const caps = [3, 7, 14, 21, 28, 30, 35];
const selectionSeeds = [20260901, 20260902, 20260903, 20260904, 20260905];
const validationSeeds = [20260906, 20260907, 20260908, 20260909, 20260910, 20260911, 20260912, 20260913, 20260914, 20260915];
const directory = resolve(dirname(fileURLToPath(import.meta.url)), '../data/evaluation');
const selectionPath = resolve(directory, 'heldout-cap-selection.json');
const validationPath = resolve(directory, 'heldout-cap-validation.json');

function runRail(capDays, rail, seeds) {
  const options = { count: 2000, seeds, now, maxDeferralDays: capDays };
  return rail === 'UPI AutoPay'
    ? evaluateNpcCalibratedRails(options)[0]
    : evaluatePerMandateRails({ ...options, rails: ['Cards'] })[0];
}

function evaluatePoint(capDays, seeds) {
  return {
    capDays,
    relationToHorizon: capDays < 30 ? 'binds before 30-day horizon' : capDays === 30 ? 'at 30-day horizon' : 'beyond 30-day horizon',
    rails: [runRail(capDays, 'UPI AutoPay', seeds), runRail(capDays, 'Cards', seeds)],
  };
}

function compactRail(rail) {
  const recovery = rail.policies.find((policy) => policy.name === 'Recovery Loop');
  const ladder = rail.policies.find((policy) => policy.name === 'T+1 / T+2 / T+3');
  const metrics = (policy) => ({
    attempts: policy.attempts,
    recoveries: policy.recovered,
    grossRevenue: policy.grossRevenue,
    netRevenue: policy.netRevenue,
    netRupeesPerAttempt: policy.netRupeesPerAttempt,
    strandedAttempts: policy.unusedAttemptsAtHorizon,
    deferralCapHits: policy.deferralCapHits,
  });
  return {
    rail: rail.rail,
    recoveryLoop: metrics(recovery),
    fixedLadder: metrics(ladder),
    pairedNetDifference: rail.pairedNetDifference,
    seedsWonByRecoveryLoop: rail.seedsWonByRecoveryLoop,
    perSeedPairedNetDifference: rail.perSeed.map((row) => ({ seed: row.seed, difference: row.pairedNetDifference })),
  };
}

async function runCaps(seeds) {
  return Promise.all(caps.map((capDays) => new Promise((resolvePoint, rejectPoint) => {
    const worker = new Worker(new URL(import.meta.url), { workerData: { capDays, seeds } });
    worker.once('message', resolvePoint);
    worker.once('error', rejectPoint);
    worker.once('exit', (code) => { if (code !== 0) rejectPoint(new Error(`Cap ${capDays} worker exited with code ${code}`)); });
  })));
}

if (!isMainThread) {
  parentPort.postMessage(evaluatePoint(workerData.capDays, workerData.seeds));
} else {
  const phase = process.argv[2];
  if (!['selection', 'validation'].includes(phase)) throw new Error('Usage: node scripts/evaluate-heldout-cap.mjs <selection|validation>');
  mkdirSync(directory, { recursive: true });

  if (phase === 'selection') {
    if (existsSync(selectionPath)) throw new Error('Selection artifact already exists; remove it deliberately before a new registered experiment.');
    const points = await runCaps(selectionSeeds);
    const ranked = points.map((point) => {
      const upi = point.rails.find((rail) => rail.rail === 'UPI AutoPay');
      return { capDays: point.capDays, meanPairedNetDifference: upi.pairedNetDifference.mean };
    }).sort((a, b) => b.meanPairedNetDifference - a.meanPairedNetDifference || a.capDays - b.capDays);
    const chosenCapDays = ranked[0].capDays;
    const output = {
      generatedAt: new Date().toISOString(),
      phase: 'selection',
      registeredBeforeRun: true,
      seeds: selectionSeeds,
      candidateCapsDays: caps,
      primaryRail: 'UPI AutoPay',
      selectionRule: 'Maximum mean paired net difference on NPCI-calibrated UPI; exact ties choose the smaller cap.',
      chosenCapDays,
      reason: `Cap ${chosenCapDays} days had the largest selection-set mean paired net difference (${ranked[0].meanPairedNetDifference}).`,
      ranking: ranked,
      points,
      compactCurve: points.map((point) => ({ capDays: point.capDays, rails: point.rails.map(compactRail) })),
    };
    writeFileSync(selectionPath, `${JSON.stringify(output, null, 2)}\n`);
    console.log(JSON.stringify({ chosenCapDays, ranking: ranked }, null, 2));
  } else {
    if (!existsSync(selectionPath)) throw new Error('Run and freeze selection before validation.');
    if (existsSync(validationPath)) throw new Error('Validation artifact already exists. The held-out set must not be rerun.');
    const selection = JSON.parse(readFileSync(selectionPath, 'utf8'));
    if (!caps.includes(selection.chosenCapDays)) throw new Error('Frozen cap is not a registered candidate.');
    const points = await runCaps(validationSeeds);
    const chosenPoint = points.find((point) => point.capDays === selection.chosenCapDays);
    const output = {
      generatedAt: new Date().toISOString(),
      phase: 'validation',
      runCount: 1,
      seeds: validationSeeds,
      frozenCapDays: selection.chosenCapDays,
      primaryResult: {
        capDays: selection.chosenCapDays,
        rails: chosenPoint.rails.map(compactRail),
      },
      robustnessCurve: points.map((point) => ({ capDays: point.capDays, rails: point.rails.map(compactRail) })),
      note: 'All registered caps were evaluated in this single locked validation batch. Only the frozen-cap row is confirmatory; other rows describe robustness and did not alter selection.',
    };
    writeFileSync(validationPath, `${JSON.stringify(output, null, 2)}\n`);
    console.log(JSON.stringify(output, null, 2));
  }
}
