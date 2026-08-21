import { runRecoverySimulation } from './generator.mjs';

export function compareOutageResponse(bank = 'HDFC', count = 500) {
  const base = { count, seed: 20260822, now: Date.UTC(2026, 7, 22, 6, 0, 0) };
  const normal = runRecoverySimulation(base);
  const outage = runRecoverySimulation({ ...base, outageBank: bank });
  const bankEvents = normal.events.filter((event) => event.bank === bank).length;
  const normalRetries = normal.decisions.filter((decision, index) => normal.events[index].bank === bank && decision.action === 'retry').length;
  const outageRetries = outage.decisions.filter((decision, index) => outage.events[index].bank === bank && decision.action === 'retry').length;
  return { bank, bankEvents, normalRetries, outageRetries, attemptsProtected: normalRetries - outageRetries };
}

if (process.argv[1]?.endsWith('outage-replay.mjs')) console.log(JSON.stringify(compareOutageResponse(), null, 2));
