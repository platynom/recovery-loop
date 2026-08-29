import { diagnoseFailure } from '../src/diagnose/taxonomy.mjs';

function shouldAttemptFixed(event) { return event.attemptNumber <= 3 && !event.issuerStop; }
function shouldAttemptPayday(event) { return diagnoseFailure(event).category === 'insufficient_funds' && (event.dayOfMonth <= 3 || event.dayOfMonth >= 28); }
function shouldAttemptThreshold(event) { return !event.issuerStop && !event.outageActive && event.bankDeclineRate < 0.08; }

export const baselines = {
  'Do nothing': () => false,
  'T+1 / T+2 / T+3': shouldAttemptFixed,
  'Payday heuristic': shouldAttemptPayday,
  'Plain threshold': shouldAttemptThreshold,
};
