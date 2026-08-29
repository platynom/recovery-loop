import { decideRecovery } from '../src/policy/scheduler.mjs';
import { observableEventAt, simulationDayMs } from '../sim/outcomes.mjs';
import { baselines } from './baselines.mjs';
import { attemptCapForRail } from '../src/policy/rail-rules.mjs';

export const maxDeferralDays = 3;

function plainDecisionAtCap(event, attemptedAt, maxAttempts) {
  const withinAttemptCap = event.attemptNumber < maxAttempts;
  return withinAttemptCap && baselines['Plain threshold'](event) ? attemptedAt : null;
}

export function resolveScheduledDecisions(events, decisions, options = {}) {
  const now = options.now;
  const operational = options.operational ?? {};
  const deferralCapAt = now + (options.maxDeferralDays ?? maxDeferralDays) * simulationDayMs;
  const traces = events.map((event, index) => {
    const initialDecision = decisions[index];
    const maxAttempts = attemptCapForRail(event.rail, operational);
    let decision = initialDecision;
    let attemptAt = null;
    let deferrals = 0;
    let hitCap = false;

    while (decision.action === 'wait') {
      deferrals += 1;
      const wakeAt = decision.scheduledAt;
      if (!Number.isFinite(wakeAt)) throw new Error(`Deferred event ${event.id} is missing scheduledAt`);
      if (wakeAt >= deferralCapAt) {
        hitCap = true;
        const freshAtCap = observableEventAt(event, deferralCapAt);
        attemptAt = plainDecisionAtCap(freshAtCap, deferralCapAt, maxAttempts);
        break;
      }
      const freshEvent = observableEventAt(event, wakeAt);
      decision = decideRecovery(freshEvent, operational, wakeAt);
    }

    if (decision.action !== 'wait' && Number.isFinite(decision.scheduledAt)) attemptAt = decision.scheduledAt;
    if (decision.action === 'refuse_terminal') attemptAt = null;
    if (event.attemptNumber >= maxAttempts) attemptAt = null;

    const attemptsConsumed = Number.isFinite(attemptAt) ? 1 : 0;
    if (event.attemptNumber + attemptsConsumed > maxAttempts) {
      throw new Error(`Attempt cap exceeded for ${event.id}: ${event.attemptNumber + attemptsConsumed}/${maxAttempts}`);
    }

    return {
      eventId: event.id,
      initialAction: initialDecision.action,
      finalAction: Number.isFinite(attemptAt) ? 'retry' : decision.action === 'refuse_terminal' ? 'refuse_terminal' : 'wait',
      attemptAt,
      deferrals,
      hitCap,
      convertedToRetry: initialDecision.action === 'wait' && Number.isFinite(attemptAt),
      attemptsConsumed,
    };
  });

  return {
    attemptTimes: traces.map((trace) => trace.attemptAt),
    traces,
    stats: {
      initiallyDeferred: traces.filter((trace) => trace.initialAction === 'wait').length,
      hardRefusals: traces.filter((trace) => trace.initialAction === 'refuse_terminal').length,
      convertedToRetry: traces.filter((trace) => trace.convertedToRetry).length,
      hitCap: traces.filter((trace) => trace.hitCap).length,
    },
  };
}
