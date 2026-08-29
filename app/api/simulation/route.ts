import { recoveryOperational, runRecoverySimulation } from '@/sim/generator.mjs';
import { diagnoseFailure } from '@/src/diagnose/taxonomy.mjs';
import { applyRefusalGate } from '@/src/gate/refusal.mjs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const outageBank = url.searchParams.get('outageBank') || null;
  const coverageThreshold = Math.min(0.8, Math.max(0.05, Number(url.searchParams.get('coverageThreshold') ?? 0.28)));
  const monthlyBudget = Math.min(1000000, Math.max(100, Number(url.searchParams.get('monthlyBudget') ?? 10000)));
  const options = { count: 250, seed: 20260822, outageBank, coverageThreshold, monthlyBudget, remainingAttempts: Math.round(monthlyBudget * 0.42), now: Date.UTC(2026, 7, 22, 6, 0, 0) };
  const run = runRecoverySimulation(options);
  const operational = recoveryOperational(options);
  return Response.json({
    mode: 'labeled-simulation',
    policy: { coverageThreshold, monthlyBudget },
    decisions: run.decisions.slice(0, 30).map((decision, index) => {
      const event = run.events[index];
      const gate = applyRefusalGate(event, { probability: decision.probability, diagnosis: diagnoseFailure(event) }, operational);
      return { ...decision, gate: { allowed: gate.allowed, reasons: gate.reasons }, event };
    }),
    metrics: {
      totalEvents: run.events.length,
      attempts: run.outcomes.filter((outcome) => outcome.attempted).length,
      recovered: run.outcomes.filter((outcome) => outcome.recovered).length,
      recoveredRevenue: run.outcomes.reduce((sum, outcome) => sum + outcome.recoveredAmount, 0),
      refused: run.decisions.filter((decision) => decision.action === 'refuse_terminal').length,
      waiting: run.decisions.filter((decision) => decision.action === 'wait').length,
    },
  });
}
