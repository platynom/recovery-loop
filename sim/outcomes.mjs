const hiddenWorlds = new WeakMap();
const DAY_MS = 24 * 60 * 60 * 1000;

export const authoredGroundTruthDefaults = Object.freeze({
  insufficientFundsSalaryPeak: 0.82,
  insufficientFundsSalaryDailyDecay: 0.10,
  insufficientFundsPostSalaryBase: 0.42,
  insufficientFundsPostSalaryDecayDays: 7,
  insufficientFundsFloor: 0.06,
  technicalDuringOutage: 0.02,
  technicalAfterOutage: 0.76,
  issuerDeclinedRecovery: 0.30,
  authenticationFailureRecovery: 0.26,
  mandateInactiveRecovery: 0,
  nonRetryableRecovery: 0,
});

export function registerHiddenWorld(event, world) {
  hiddenWorlds.set(event, Object.freeze({ ...world }));
}

function worldFor(event) {
  const world = hiddenWorlds.get(event);
  if (!world) throw new Error(`No hidden simulation world registered for ${event.id}`);
  return world;
}

function daysSinceSalary(attemptedAt, salaryDay) {
  const attemptDay = new Date(attemptedAt).getUTCDate();
  return (attemptDay - salaryDay + 30) % 30;
}

export function trueProbability(event, attemptedAt) {
  const world = worldFor(event);
  const factors = world.groundTruthFactors ?? {};
  const factor = (rule) => factors[rule] ?? 1;
  const scaled = (probability) => Math.min(1, Math.max(0, probability));

  // Insufficient-funds recovery is strongest on salary day and the following
  // three days, then decays as the customer's hidden balance cycle moves away.
  if (world.category === 'insufficient_funds') {
    const distance = daysSinceSalary(attemptedAt, world.salaryDay);
    const peak = authoredGroundTruthDefaults.insufficientFundsSalaryPeak * factor('salary_peak_probability');
    const dailyDecay = authoredGroundTruthDefaults.insufficientFundsSalaryDailyDecay * factor('salary_daily_decay');
    const base = authoredGroundTruthDefaults.insufficientFundsPostSalaryBase * factor('post_salary_base_probability');
    const decayDays = authoredGroundTruthDefaults.insufficientFundsPostSalaryDecayDays * factor('post_salary_decay_days');
    const floor = authoredGroundTruthDefaults.insufficientFundsFloor * factor('insufficient_funds_floor');
    if (distance <= 3) return Number(scaled(peak - distance * dailyDecay).toFixed(4));
    return Number(scaled(Math.max(floor, base * Math.exp(-(distance - 3) / decayDays))).toFixed(4));
  }

  // Technical attempts almost always fail while the bank's hidden outage
  // window is open and recover strongly after the window has cleared.
  if (world.category === 'technical') {
    const active = authoredGroundTruthDefaults.technicalDuringOutage * factor('technical_during_outage_probability');
    const cleared = authoredGroundTruthDefaults.technicalAfterOutage * factor('technical_after_clearance_probability');
    return Number(scaled(attemptedAt < world.outageClearsAt ? active : cleared).toFixed(4));
  }

  // Issuer declines are moderately recoverable and are deliberately flat so
  // timing policies cannot manufacture an advantage from this hidden label.
  if (world.category === 'issuer_declined') {
    return Number(scaled(authoredGroundTruthDefaults.issuerDeclinedRecovery * factor('issuer_declined_probability')).toFixed(4));
  }

  // Customer-action failures are moderately recoverable and time-invariant in
  // this simulation because no hidden intervention model is available.
  if (world.category === 'customer_action') {
    return Number(scaled(authoredGroundTruthDefaults.authenticationFailureRecovery * factor('authentication_failure_probability')).toFixed(4));
  }

  // An inactive mandate cannot recover without a new mandate.
  if (world.category === 'mandate_inactive') return 0;

  // Merchant-configuration rejections are permanent for every retry horizon.
  if (world.category === 'non_retryable') return 0;

  throw new Error(`No ground-truth rule for simulated category ${world.category}`);
}

export function simulateAttempt(event, attemptedAt, retryOrdinal = 1) {
  if (!Number.isFinite(attemptedAt)) return { attempted: false, recovered: false, recoveredAmount: 0, attemptCost: 0 };
  const world = worldFor(event);
  const probability = trueProbability(event, attemptedAt);
  const outcomeDraw = world.outcomeDraws[Math.max(0, retryOrdinal - 1)] ?? world.outcomeDraws.at(-1);
  const recovered = outcomeDraw < probability;
  return {
    attempted: true,
    recovered,
    recoveredAmount: recovered ? event.amount : 0,
    attemptCost: 1,
  };
}

export function observableEventAt(event, observedAt) {
  const world = worldFor(event);
  const outageActive = observedAt < world.outageClearsAt;
  const baseline = event.bankBaselineDeclineRate ?? 0.03;
  const normal = event.normalBankDeclineRate ?? Math.min(event.bankDeclineRate, baseline);
  const multiplier = event.incidentDeviationMultiplier ?? 4;
  const bankDeclineRate = outageActive ? Math.max(event.bankDeclineRate, baseline * multiplier) : normal;
  return {
    ...event,
    outageActive,
    bankDeclineRate,
    bankDeclineDeviation: bankDeclineRate / baseline,
    hour: new Date(observedAt).getUTCHours(),
    dayOfMonth: new Date(observedAt).getUTCDate(),
  };
}

export const simulationDayMs = DAY_MS;
