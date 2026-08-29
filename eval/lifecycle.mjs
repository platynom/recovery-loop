import { diagnoseFailure } from '../src/diagnose/taxonomy.mjs';
import { decideRecovery } from '../src/policy/scheduler.mjs';
import { attemptCapForRail, isMastercardHardStop, isUpiPeakWindow, legalAttemptTime } from '../src/policy/rail-rules.mjs';
import { observableEventAt, simulateAttempt, simulationDayMs } from '../sim/outcomes.mjs';
import { baselines } from './baselines.mjs';

export const evaluationHorizonDays = 30;
export const declinePenaltyThreshold = 0.15;
export const declinePenaltyRupees = 415000;

function retryCost(retryOrdinal) {
  return retryOrdinal === 1 ? 1 : 2;
}

function newMandateState(event, operational) {
  const attemptCap = attemptCapForRail(event.rail, operational);
  return {
    mandateId: event.mandateId,
    attemptsConsumed: event.attemptNumber,
    retryAttempts: 0,
    failures: 0,
    recovered: false,
    recoveredAmount: 0,
    attemptCost: 0,
    stopSignalPenalty: 0,
    exhausted: false,
    recoveryAvailableAtCap: false,
    illegalUpiCandidates: 0,
    deferrals: 0,
    hitDeferralCap: false,
    initialDecisionAction: null,
    convertedFromWaitToRetry: false,
    attempts: [],
    attemptCap,
    hardStopped: hardStop(event),
  };
}

function hardStop(event) {
  return event.issuerStop || isMastercardHardStop(event);
}

function attemptMandate(event, state, proposedAt, decisionAt, context) {
  const cap = attemptCapForRail(event.rail, context.operational);
  if (hardStop(event) || state.attemptsConsumed >= cap || context.budget.used >= context.budget.limit) return false;
  if (event.rail === 'UPI AutoPay' && isUpiPeakWindow(proposedAt)) state.illegalUpiCandidates += 1;
  const attemptedAt = legalAttemptTime(event, proposedAt, decisionAt);
  if (attemptedAt > context.horizonAt) return false;

  const retryOrdinal = state.retryAttempts + 1;
  const outcome = simulateAttempt(event, attemptedAt, retryOrdinal);
  if (state.deferrals > 0) state.convertedFromWaitToRetry = true;
  state.retryAttempts += 1;
  state.attemptsConsumed += 1;
  context.budget.used += 1;
  state.attemptCost += retryCost(retryOrdinal);
  state.attempts.push({ attemptedAt, recovered: outcome.recovered, retryOrdinal });
  if (outcome.recovered) {
    state.recovered = true;
    state.recoveredAmount = event.amount;
    return true;
  }

  state.failures += 1;
  if (state.attemptsConsumed >= cap) {
    state.exhausted = true;
    const counterfactualAt = legalAttemptTime(event, attemptedAt + simulationDayMs, attemptedAt);
    state.recoveryAvailableAtCap = counterfactualAt <= context.horizonAt
      && simulateAttempt(event, counterfactualAt, retryOrdinal + 1).recovered;
  }
  return true;
}

function runFixedLadder(event, state, context) {
  let decisionAt = context.now;
  for (const day of [1, 2, 3]) {
    if (state.recovered || state.exhausted || hardStop(event)) break;
    const proposedAt = context.now + day * simulationDayMs;
    const attempted = attemptMandate(event, state, proposedAt, decisionAt, context);
    if (!attempted) break;
    decisionAt = state.attempts.at(-1).attemptedAt;
  }
}

function runSingleAttempt(event, state, context, policyName) {
  if (!baselines[policyName](event) || hardStop(event)) return;
  const delay = policyName === 'Payday heuristic' ? simulationDayMs : 2 * 60 * 60 * 1000;
  attemptMandate(event, state, context.now + delay, context.now, context);
}

function runRecoveryLoop(event, state, context) {
  let observedAt = context.now;
  const deferralCapAt = context.now + 3 * simulationDayMs;
  while (!state.recovered && !state.exhausted && observedAt <= context.horizonAt && context.budget.used < context.budget.limit) {
    const freshEvent = { ...observableEventAt(event, observedAt), attemptNumber: state.attemptsConsumed };
    const decision = decideRecovery(freshEvent, {
      ...context.operational,
      mandateAttemptsRemaining: state.attemptCap - state.attemptsConsumed,
      evaluationHorizonAt: context.horizonAt,
    }, observedAt);
    if (state.initialDecisionAction === null) state.initialDecisionAction = decision.action;
    if (decision.action === 'wait') {
      state.deferrals += 1;
      if (decision.scheduledAt >= deferralCapAt) {
        state.hitDeferralCap = true;
        const freshAtCap = { ...observableEventAt(event, deferralCapAt), attemptNumber: state.attemptsConsumed };
        if (baselines['Plain threshold'](freshAtCap)) attemptMandate(event, state, deferralCapAt, observedAt, context);
        break;
      }
      observedAt = decision.scheduledAt;
      continue;
    }

    if (decision.action === 'refuse_terminal') break;
    if (!Number.isFinite(decision.scheduledAt)) break;
    const attempted = attemptMandate(event, state, decision.scheduledAt, observedAt, context);
    if (!attempted || state.recovered || state.exhausted) break;
    observedAt = state.attempts.at(-1).attemptedAt;
  }
}

function summarizePolicy(name, mandates) {
  const attempts = mandates.reduce((sum, mandate) => sum + mandate.retryAttempts, 0);
  const retryFailures = mandates.reduce((sum, mandate) => sum + mandate.failures, 0);
  const totalAuthorizationAttempts = mandates.length + attempts;
  const failures = mandates.length + retryFailures;
  const grossRevenue = mandates.reduce((sum, mandate) => sum + mandate.recoveredAmount, 0);
  const attemptCost = mandates.reduce((sum, mandate) => sum + mandate.attemptCost, 0);
  const stopSignalPenalty = mandates.reduce((sum, mandate) => sum + mandate.stopSignalPenalty, 0);
  // The cohort's original failure happened before the evaluated policy acted.
  // Penalty eligibility therefore uses this policy's own retry attempts and
  // failed retries only. A zero-attempt policy has a defined 0% policy rate.
  const declineRate = attempts ? retryFailures / attempts : 0;
  const declinePenaltyTriggered = attempts > 0 && declineRate > declinePenaltyThreshold;
  const declinePenalty = declinePenaltyTriggered ? declinePenaltyRupees : 0;
  const netRevenueWithoutDeclinePenalty = grossRevenue - attemptCost - stopSignalPenalty;
  const netRevenue = netRevenueWithoutDeclinePenalty - declinePenalty;
  return {
    name,
    attempts,
    totalAuthorizationAttempts,
    recovered: mandates.filter((mandate) => mandate.recovered).length,
    failures,
    grossRevenue: Number(grossRevenue.toFixed(2)),
    netRevenue: Number(netRevenue.toFixed(2)),
    netRevenueWithoutDeclinePenalty: Number(netRevenueWithoutDeclinePenalty.toFixed(2)),
    attemptCost: Number(attemptCost.toFixed(2)),
    stopSignalPenalty: Number(stopSignalPenalty.toFixed(2)),
    declinePenalty,
    declineRate,
    declinePenaltyTriggered,
    grossRupeesPerAttempt: attempts ? grossRevenue / attempts : 0,
    netRupeesPerAttempt: attempts ? netRevenue / attempts : 0,
    exhaustedMandates: mandates.filter((mandate) => mandate.exhausted).length,
    recoveriesAvailableAtCap: mandates.filter((mandate) => mandate.exhausted && mandate.recoveryAvailableAtCap).length,
    illegalUpiCandidates: mandates.reduce((sum, mandate) => sum + mandate.illegalUpiCandidates, 0),
    deferredMandates: mandates.filter((mandate) => mandate.deferrals > 0).length,
    initialHardRefusals: mandates.filter((mandate) => mandate.initialDecisionAction === 'refuse_terminal').length,
    initialWaits: mandates.filter((mandate) => mandate.initialDecisionAction === 'wait').length,
    initialRetries: mandates.filter((mandate) => mandate.initialDecisionAction === 'retry').length,
    deferredConvertedToRetry: mandates.filter((mandate) => mandate.convertedFromWaitToRetry).length,
    deferredRecovered: mandates.filter((mandate) => mandate.convertedFromWaitToRetry && mandate.recovered).length,
    deferralCapHits: mandates.filter((mandate) => mandate.hitDeferralCap).length,
    unusedAttemptsAtHorizon: mandates.filter((mandate) => !mandate.recovered).reduce((sum, mandate) => sum + Math.max(0, mandate.attemptCap - mandate.attemptsConsumed), 0),
    unusedAttemptsAfterRecovery: mandates.filter((mandate) => mandate.recovered).reduce((sum, mandate) => sum + Math.max(0, mandate.attemptCap - mandate.attemptsConsumed), 0),
    unusedAttemptsOnHardStops: mandates.filter((mandate) => !mandate.recovered && mandate.hardStopped).reduce((sum, mandate) => sum + Math.max(0, mandate.attemptCap - mandate.attemptsConsumed), 0),
    mandates,
  };
}

export function evaluatePolicyLifecycle(name, events, options = {}) {
  const context = {
    now: options.now,
    horizonAt: options.now + evaluationHorizonDays * simulationDayMs,
    operational: options.operational ?? {},
    budget: { used: 0, limit: options.attemptBudget ?? Number.POSITIVE_INFINITY },
  };
  const mandates = events.map((event) => {
    const state = newMandateState(event, context.operational);
    if (name === 'T+1 / T+2 / T+3') runFixedLadder(event, state, context);
    else if (name === 'Payday heuristic' || name === 'Plain threshold') runSingleAttempt(event, state, context, name);
    else if (name === 'Recovery Loop') runRecoveryLoop(event, state, context);
    const cap = attemptCapForRail(event.rail, context.operational);
    if (state.attemptsConsumed > cap) throw new Error(`${name} exceeded ${event.rail} cap for ${event.mandateId}`);
    return state;
  });
  return summarizePolicy(name, mandates);
}

export function categoryForLifecycle(event) {
  return diagnoseFailure(event).category;
}
