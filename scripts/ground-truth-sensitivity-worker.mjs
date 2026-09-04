import { parentPort, workerData } from 'node:worker_threads';
import { evaluatePolicyLifecycle } from '../eval/lifecycle.mjs';
import { generateFailureEvents, recoveryOperational } from '../sim/generator.mjs';

const now = Date.UTC(2026, 7, 22, 6, 0, 0);
const { scenario, rail, seed } = workerData;
const generation = { count: 2000, now, seed, rail, groundTruthPerturbation: scenario.perturbation, calibration: 'npci', outageBank: null };
const events = generateFailureEvents(2000, generation);
const operational = { ...recoveryOperational(generation), attemptBudgetMode: 'per-mandate' };
const fixed = evaluatePolicyLifecycle('T+1 / T+2 / T+3', events, { now, operational, maxDeferralDays: 14 });
const recovery = evaluatePolicyLifecycle('Recovery Loop', events, { now, operational, maxDeferralDays: 14 });
parentPort.postMessage({
  scenario: scenario.name,
  rail,
  seed,
  pairedNetDifference: recovery.netRevenue - fixed.netRevenue,
  recoveryLoopNetRevenue: recovery.netRevenue,
  fixedLadderNetRevenue: fixed.netRevenue,
});
