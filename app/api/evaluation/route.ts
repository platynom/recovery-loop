import { evaluatePolicies } from '@/eval/evaluate.mjs';
import fix5Evidence from '@/data/evaluation/fix5-scarcity-curve.json';
import fix6Evidence from '@/data/evaluation/fix6-per-mandate.json';
import fix7Evidence from '@/data/evaluation/fix7-npci-calibrated.json';
import heldoutCapValidation from '@/data/evaluation/heldout-cap-validation.json';

export const dynamic = 'force-dynamic';

function dashboardRail(rail: (typeof heldoutCapValidation.primaryResult.rails)[number]) {
  const policy = (name: string, metrics: typeof rail.recoveryLoop) => ({
    name,
    attempts: metrics.attempts,
    recovered: metrics.recoveries,
    grossRevenue: metrics.grossRevenue,
    netRevenue: metrics.netRevenue,
    netRupeesPerAttempt: metrics.netRupeesPerAttempt,
    unusedAttemptsAtHorizon: metrics.strandedAttempts,
  });
  return {
    rail: rail.rail,
    cohortSize: 2000,
    retriesPerMandate: 3,
    policies: [policy('Recovery Loop', rail.recoveryLoop), policy('T+1 / T+2 / T+3', rail.fixedLadder)],
    pairedNetDifference: rail.pairedNetDifference,
    seedsWonByRecoveryLoop: rail.seedsWonByRecoveryLoop,
    perSeed: rail.perSeedPairedNetDifference,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const count = Math.min(5000, Math.max(100, Number(url.searchParams.get('count') ?? 1000)));
  const outageBank = url.searchParams.get('outageBank') || null;
  return Response.json({
    ...evaluatePolicies({ count, seed: 20260822, outageBank, now: Date.UTC(2026, 7, 22, 6, 0, 0) }),
    fix5Evidence,
    fix6Evidence,
    fix7Evidence,
    headlineEvidence: {
      capDays: heldoutCapValidation.frozenCapDays,
      label: 'Held-out validation',
      reportedRails: {
        upiNpcCalibrated: dashboardRail(heldoutCapValidation.primaryResult.rails.find((rail) => rail.rail === 'UPI AutoPay')!),
        cardsUncalibrated: dashboardRail(heldoutCapValidation.primaryResult.rails.find((rail) => rail.rail === 'Cards')!),
      },
    },
  });
}
