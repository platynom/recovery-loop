const hiddenWorlds = new WeakMap();
const DAY_MS = 24 * 60 * 60 * 1000;

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

  // Insufficient-funds recovery is strongest on salary day and the following
  // three days, then decays as the customer's hidden balance cycle moves away.
  if (world.category === 'insufficient_funds') {
    const distance = daysSinceSalary(attemptedAt, world.salaryDay);
    if (distance <= 3) return Number((0.82 - distance * 0.1).toFixed(4));
    return Number(Math.max(0.06, 0.42 * Math.exp(-(distance - 3) / 7)).toFixed(4));
  }

  // Technical attempts almost always fail while the bank's hidden outage
  // window is open and recover strongly after the window has cleared.
  if (world.category === 'technical') return attemptedAt < world.outageClearsAt ? 0.02 : 0.76;

  // Issuer declines are moderately recoverable and are deliberately flat so
  // timing policies cannot manufacture an advantage from this hidden label.
  if (world.category === 'issuer_declined') return 0.3;

  // Customer-action failures are moderately recoverable and time-invariant in
  // this simulation because no hidden intervention model is available.
  if (world.category === 'customer_action') return 0.26;

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
