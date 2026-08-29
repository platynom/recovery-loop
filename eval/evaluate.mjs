import { generateFailureEvents, recoveryOperational } from '../sim/generator.mjs';
import { simulateAttempt, simulationDayMs } from '../sim/outcomes.mjs';
import { predictRecovery } from '../src/predict/recovery.mjs';
import { evaluatePolicyLifecycle } from './lifecycle.mjs';
import { buildMandateOpportunityTable } from '../src/policy/mandate-opportunity.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_NOW = Date.UTC(2026, 7, 22, 6, 0, 0);
const policyNames = ['Do nothing', 'T+1 / T+2 / T+3', 'Payday heuristic', 'Plain threshold', 'Recovery Loop'];
export const evaluationSeeds = [20260818, 20260819, 20260820, 20260821, 20260822];
export const scarcityBudgets = [
  ...Array.from({ length: 40 }, (_, index) => (index + 1) * 50),
  ...Array.from({ length: 20 }, (_, index) => 2100 + index * 100),
];

function publicPolicy(policy) {
  const result = { ...policy };
  delete result.mandates;
  return { ...result, revenue: result.grossRevenue, rupeesPerAttempt: result.grossRupeesPerAttempt };
}

export function evaluatePolicies(options = {}) {
  const now = options.now ?? DEFAULT_NOW;
  const events = generateFailureEvents(options.count ?? 2000, { ...options, now });
  const operational = recoveryOperational(options);
  const internalPolicies = policyNames.map((name) => evaluatePolicyLifecycle(name, events, { now, operational, attemptBudget: options.attemptBudget }));
  const activeAttempts = internalPolicies.filter((policy) => policy.attempts > 0).map((policy) => policy.attempts);
  const fixedBudget = activeAttempts.length ? Math.min(...activeAttempts) : 0;
  const policies = internalPolicies.map((policy) => {
    if (!policy.attempts || !fixedBudget) return { ...publicPolicy(policy), grossRevenueAtFixedBudget: 0, netRevenueAtFixedBudget: 0, revenueAtFixedBudget: 0 };
    const fixed = evaluatePolicyLifecycle(policy.name, events, { now, operational, attemptBudget: fixedBudget });
    return { ...publicPolicy(policy), grossRevenueAtFixedBudget: fixed.grossRevenue, netRevenueAtFixedBudget: fixed.netRevenue, revenueAtFixedBudget: fixed.grossRevenue };
  });

  const horizon = now + simulationDayMs;
  const horizonRows = events.map((event) => ({ event, prediction: predictRecovery(event, 24), outcome: simulateAttempt(event, horizon, 1) }));
  const riskCoverage = [0.15, 0.25, 0.35, 0.45, 0.55, 0.65].map((threshold) => {
    const covered = horizonRows.filter((row) => row.prediction.probability >= threshold);
    return { threshold, coverage: covered.length / horizonRows.length, precision: covered.length ? covered.filter((row) => row.outcome.recovered).length / covered.length : 1 };
  });
  const calibration = Array.from({ length: 10 }, (_, bucket) => {
    const low = bucket / 10; const high = (bucket + 1) / 10;
    const members = horizonRows.filter((row) => row.prediction.probability >= low && row.prediction.probability < high);
    return { range: `${low.toFixed(1)}–${high.toFixed(1)}`, count: members.length, predicted: members.length ? members.reduce((sum, row) => sum + row.prediction.probability, 0) / members.length : 0, observed: members.length ? members.filter((row) => row.outcome.recovered).length / members.length : 0 };
  });
  return {
    seed: options.seed ?? 42,
    generatedAt: new Date(now).toISOString(),
    sampleSize: events.length,
    fixedBudget,
    policies,
    riskCoverage,
    calibration,
    limitations: ['Synthetic mandate lifecycles use pre-registered scenario costs and penalties.', 'The 15% decline trigger is a stress-test assumption, not a current Visa VAMP threshold.', 'Replace simulation with observed merchant lifecycle outcomes before making external performance claims.'],
  };
}

function spread(values) {
  return { mean: values.reduce((sum, value) => sum + value, 0) / values.length, min: Math.min(...values), max: Math.max(...values) };
}

export function evaluateScarcity(options = {}) {
  const now = options.now ?? DEFAULT_NOW;
  const seeds = options.seeds ?? evaluationSeeds;
  const budgets = options.budgets ?? scarcityBudgets;
  const points = budgets.map((attemptBudget) => {
    const paired = seeds.map((seed) => {
      const events = generateFailureEvents(options.count ?? 2000, { ...options, now, seed });
      const operational = recoveryOperational(options);
      const fixed = evaluatePolicyLifecycle('T+1 / T+2 / T+3', events, { now, operational, attemptBudget });
      const recovery = evaluatePolicyLifecycle('Recovery Loop', events, { now, operational, attemptBudget });
      return {
        seed,
        netDifference: recovery.netRevenue - fixed.netRevenue,
        netDifferenceWithoutDeclinePenalty: recovery.netRevenueWithoutDeclinePenalty - fixed.netRevenueWithoutDeclinePenalty,
      };
    });
    return {
      attemptBudget,
      pairedNetDifference: spread(paired.map((row) => row.netDifference)),
      pairedNetDifferenceWithoutDeclinePenalty: spread(paired.map((row) => row.netDifferenceWithoutDeclinePenalty)),
      perSeed: paired,
    };
  });
  const signChanges = points.slice(1).flatMap((point, index) => {
    const previous = points[index];
    const changed = Math.sign(previous.pairedNetDifference.mean) !== Math.sign(point.pairedNetDifference.mean);
    return changed ? [{ fromBudget: previous.attemptBudget, toBudget: point.attemptBudget, fromMean: previous.pairedNetDifference.mean, toMean: point.pairedNetDifference.mean }] : [];
  });
  const upperCrossover = points.find((point) => point.attemptBudget >= 2000 && point.pairedNetDifference.mean <= 0) ?? null;
  const upperCrossoverIndex = upperCrossover ? points.indexOf(upperCrossover) : -1;
  return {
    budgets,
    upperCrossoverBudget: upperCrossover?.attemptBudget ?? null,
    precedingWinningPoint: upperCrossoverIndex > 0 ? points[upperCrossoverIndex - 1] : null,
    signChanges,
    points,
  };
}

function evaluateRailOperatingPoints(options = {}) {
  const now = options.now ?? DEFAULT_NOW;
  const seeds = options.seeds ?? evaluationSeeds;
  return ['UPI AutoPay', 'Cards'].map((rail) => {
    const cohortSize = options.count ?? 2000;
    const availableRetryBudget = cohortSize * 3;
    const paired = seeds.map((seed) => {
      const events = generateFailureEvents(cohortSize, { ...options, now, seed, rail });
      const operational = recoveryOperational(options);
      const fixed = evaluatePolicyLifecycle('T+1 / T+2 / T+3', events, { now, operational, attemptBudget: availableRetryBudget });
      const recovery = evaluatePolicyLifecycle('Recovery Loop', events, { now, operational, attemptBudget: availableRetryBudget });
      return {
        seed,
        fixedAttempts: fixed.attempts,
        recoveryLoopAttempts: recovery.attempts,
        netDifference: recovery.netRevenue - fixed.netRevenue,
        netDifferenceWithoutDeclinePenalty: recovery.netRevenueWithoutDeclinePenalty - fixed.netRevenueWithoutDeclinePenalty,
      };
    });
    return {
      rail,
      mode: 'portfolio-priced; summed mandate ceilings are not a transferable rail budget',
      validRailOperatingPoint: false,
      cohortSize,
      retriesPerMandate: 3,
      availableRetryBudget,
      pairedNetDifference: spread(paired.map((row) => row.netDifference)),
      pairedNetDifferenceWithoutDeclinePenalty: spread(paired.map((row) => row.netDifferenceWithoutDeclinePenalty)),
      fixedAttempts: spread(paired.map((row) => row.fixedAttempts)),
      recoveryLoopAttempts: spread(paired.map((row) => row.recoveryLoopAttempts)),
      perSeed: paired,
    };
  });
}

export function evaluatePerMandateRails(options = {}) {
  const now = options.now ?? DEFAULT_NOW;
  const seeds = options.seeds ?? evaluationSeeds;
  return (options.rails ?? ['UPI AutoPay', 'Cards']).map((rail) => {
    const cohortSize = options.count ?? 2000;
    const perSeed = seeds.map((seed) => {
      const events = generateFailureEvents(cohortSize, { ...options, now, seed, rail });
      const operational = { ...recoveryOperational(options), attemptBudgetMode: 'per-mandate' };
      const fixed = evaluatePolicyLifecycle('T+1 / T+2 / T+3', events, { now, operational });
      const recovery = evaluatePolicyLifecycle('Recovery Loop', events, { now, operational });
      return {
        seed,
        policies: [publicPolicy(fixed), publicPolicy(recovery)],
        pairedNetDifference: recovery.netRevenue - fixed.netRevenue,
      };
    });
    const policyResults = ['T+1 / T+2 / T+3', 'Recovery Loop'].map((name) => {
      const samples = perSeed.map((run) => run.policies.find((policy) => policy.name === name));
      return {
        name,
        attempts: spread(samples.map((sample) => sample.attempts)),
        recovered: spread(samples.map((sample) => sample.recovered)),
        grossRevenue: spread(samples.map((sample) => sample.grossRevenue)),
        netRevenue: spread(samples.map((sample) => sample.netRevenue)),
        netRupeesPerAttempt: spread(samples.map((sample) => sample.netRupeesPerAttempt)),
        unusedAttemptsAtHorizon: spread(samples.map((sample) => sample.unusedAttemptsAtHorizon)),
        unusedAttemptsAfterRecovery: spread(samples.map((sample) => sample.unusedAttemptsAfterRecovery)),
        unusedAttemptsOnHardStops: spread(samples.map((sample) => sample.unusedAttemptsOnHardStops)),
        initialHardRefusals: spread(samples.map((sample) => sample.initialHardRefusals)),
        initialWaits: spread(samples.map((sample) => sample.initialWaits)),
        initialRetries: spread(samples.map((sample) => sample.initialRetries)),
        deferredMandates: spread(samples.map((sample) => sample.deferredMandates)),
        deferredConvertedToRetry: spread(samples.map((sample) => sample.deferredConvertedToRetry)),
        deferredRecovered: spread(samples.map((sample) => sample.deferredRecovered)),
        deferralCapHits: spread(samples.map((sample) => sample.deferralCapHits)),
      };
    });
    const tableEvent = generateFailureEvents(100, { ...options, now, seed: seeds[0], rail })
      .find((event) => !event.issuerStop
        && predictRecovery(event, 24).diagnosis.retryable
        && !['03', '21'].includes(event.merchantAdviceCode));
    if (!tableEvent) throw new Error(`No retryable representative event generated for ${rail}`);
    const tableOperational = { ...recoveryOperational(options), attemptBudgetMode: 'per-mandate' };
    return {
      rail,
      cohortSize,
      retriesPerMandate: 3,
      mode: 'per-mandate-non-transferable',
      policies: policyResults,
      pairedNetDifference: spread(perSeed.map((run) => run.pairedNetDifference)),
      seedsWonByRecoveryLoop: perSeed.filter((run) => run.pairedNetDifference > 0).length,
      perSeed,
      representativeOpportunityTable: {
        eventId: tableEvent.id,
        seed: seeds[0],
        amount: tableEvent.amount,
        table: buildMandateOpportunityTable(tableEvent, {
          decisionAt: now,
          candidateAt: now,
          horizonAt: now + 30 * simulationDayMs,
          attemptsRemaining: 3,
          operational: tableOperational,
        }),
      },
    };
  });
}

export function evaluateNpcCalibratedRails(options = {}) {
  // NPCI AutoPay is calibrated. Cards are deliberately excluded because NACH
  // bulk-debit returns are not card-authorization baselines.
  return evaluatePerMandateRails({ ...options, rails: ['UPI AutoPay'], calibration: 'npci', outageBank: null });
}

export function evaluateAcrossSeeds(options = {}) {
  const seeds = options.seeds ?? evaluationSeeds;
  const runs = seeds.map((seed) => evaluatePolicies({ ...options, seeds: undefined, includeScarcity: undefined, seed }));
  const policies = policyNames.map((name) => {
    const samples = runs.map((run) => run.policies.find((policy) => policy.name === name));
    return {
      name,
      attempts: spread(samples.map((sample) => sample.attempts)),
      totalAuthorizationAttempts: spread(samples.map((sample) => sample.totalAuthorizationAttempts)),
      recovered: spread(samples.map((sample) => sample.recovered)),
      grossRevenue: spread(samples.map((sample) => sample.grossRevenue)),
      netRevenue: spread(samples.map((sample) => sample.netRevenue)),
      netRevenueWithoutDeclinePenalty: spread(samples.map((sample) => sample.netRevenueWithoutDeclinePenalty)),
      grossRupeesPerAttempt: spread(samples.map((sample) => sample.grossRupeesPerAttempt)),
      netRupeesPerAttempt: spread(samples.map((sample) => sample.netRupeesPerAttempt)),
      declineRate: spread(samples.map((sample) => sample.declineRate)),
      declinePenaltyTriggeredSeeds: samples.filter((sample) => sample.declinePenaltyTriggered).length,
      exhaustedMandates: spread(samples.map((sample) => sample.exhaustedMandates)),
      recoveriesAvailableAtCap: spread(samples.map((sample) => sample.recoveriesAvailableAtCap)),
      illegalUpiCandidates: spread(samples.map((sample) => sample.illegalUpiCandidates)),
      unusedAttemptsAtHorizon: spread(samples.map((sample) => sample.unusedAttemptsAtHorizon)),
      unusedAttemptsAfterRecovery: spread(samples.map((sample) => sample.unusedAttemptsAfterRecovery)),
      grossRevenueAtFixedBudget: spread(samples.map((sample) => sample.grossRevenueAtFixedBudget)),
      netRevenueAtFixedBudget: spread(samples.map((sample) => sample.netRevenueAtFixedBudget)),
    };
  });
  const result = {
    seeds,
    sampleSizePerSeed: runs[0].sampleSize,
    totalSyntheticMandates: runs.reduce((sum, run) => sum + run.sampleSize, 0),
    fixedBudget: spread(runs.map((run) => run.fixedBudget)),
    policies,
    perSeed: runs.map((run) => ({ seed: run.seed, fixedBudget: run.fixedBudget, policies: run.policies })),
  };
  if (options.includeScarcity) {
    result.scarcity = evaluateScarcity(options);
    result.railOperatingPoints = evaluateRailOperatingPoints(options);
  }
  if (options.includePerMandate) result.perMandateRails = evaluatePerMandateRails(options);
  return result;
}

if (process.argv[1]?.endsWith('evaluate.mjs')) {
  const result = evaluateAcrossSeeds({ count: 2000, outageBank: 'HDFC', includeScarcity: true, includePerMandate: true });
  const outputPath = resolve(dirname(fileURLToPath(import.meta.url)), '../data/evaluation/fix5-scarcity-curve.json');
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify({ generatedAt: new Date(DEFAULT_NOW).toISOString(), seeds: result.seeds, scenario: 'shared transferable portfolio budget', scarcity: result.scarcity, railOperatingPoints: result.railOperatingPoints }, null, 2)}\n`);
  const perMandatePath = resolve(dirname(fileURLToPath(import.meta.url)), '../data/evaluation/fix6-per-mandate.json');
  writeFileSync(perMandatePath, `${JSON.stringify({ generatedAt: new Date(DEFAULT_NOW).toISOString(), seeds: result.seeds, perMandateRails: result.perMandateRails }, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
}
