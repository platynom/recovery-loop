import calibration from '../data/npci/calibration-2026-08-22.json' with { type: 'json' };

const DAY_MS = 24 * 60 * 60 * 1000;

function weightedPick(items, weight, random) {
  const total = items.reduce((sum, item) => sum + Math.max(0, weight(item)), 0);
  let cursor = random() * total;
  for (const item of items) { cursor -= Math.max(0, weight(item)); if (cursor < 0) return item; }
  return items.at(-1);
}

function factorFor(perturbation, rule) {
  if (!perturbation) return 1;
  if (perturbation.rule === rule) return perturbation.factor;
  return perturbation.factors?.[rule] ?? 1;
}

function hardDeclineCategory(random, perturbation) {
  // ASSUMPTION: NPCI does not publish the subtype composition inside hard
  // declines. Preserve the pre-registered 12:9:5:2 relative split only here.
  const categories = [
    ['issuer_declined', 12 * factorFor(perturbation, 'hard_subtype_issuer_weight')],
    ['customer_action', 9 * factorFor(perturbation, 'hard_subtype_authentication_weight')],
    ['mandate_inactive', 5 * factorFor(perturbation, 'hard_subtype_mandate_inactive_weight')],
    ['non_retryable', 2 * factorFor(perturbation, 'hard_subtype_non_retryable_weight')],
  ];
  return weightedPick(categories, (entry) => entry[1], random)[0];
}

function sampleResponseDay(shares, random) {
  const total = shares.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return 0;
  return weightedPick(shares.map((share, day) => ({ day, share })), (item) => item.share, random).day;
}

export function sampleNpcFailure(rail, random, now, perturbation = null) {
  if (rail !== 'UPI AutoPay') {
    throw new Error(`NPCI calibration supports UPI AutoPay only; ${rail} has no valid public card-authorization baseline`);
  }
  // ASSUMPTION: months are sampled uniformly. The rates and within-month bank
  // weights are real; the evaluation is not forecasting a future month mix.
  const month = calibration.periods[Math.floor(random() * calibration.periods.length)];
  const bankRow = weightedPick(month.banks, (row) => row.autopay.volumeMillions
    * (row.autopay.businessDeclineRate + row.autopay.technicalDeclineRate), random);

  let category;
  const totalDecline = bankRow.autopay.businessDeclineRate + bankRow.autopay.technicalDeclineRate;
  const technicalShare = totalDecline ? bankRow.autopay.technicalDeclineRate / totalDecline : 0;
  // Sensitivity only: scale the published technical-vs-business odds while
  // preserving the frozen NPCI share when the factor is 1.
  const technicalOddsFactor = factorFor(perturbation, 'failure_class_mix');
  const perturbedTechnicalShare = technicalShare >= 1
    ? 1
    : (technicalShare * technicalOddsFactor) / (1 - technicalShare + technicalShare * technicalOddsFactor);
  if (random() < perturbedTechnicalShare) category = 'technical';
  else {
    const hardShare = bankRow.nachReturns.financialBusinessDeclineRate + bankRow.nachReturns.nonFinancialBusinessDeclineRate
      ? bankRow.nachReturns.nonFinancialBusinessDeclineRate / (bankRow.nachReturns.financialBusinessDeclineRate + bankRow.nachReturns.nonFinancialBusinessDeclineRate) : 0;
    const perturbedHardShare = Math.min(1, hardShare * factorFor(perturbation, 'mapped_hard_decline_share'));
    category = random() < perturbedHardShare ? hardDeclineCategory(random, perturbation) : 'insufficient_funds';
  }

  const responseLagDays = sampleResponseDay(bankRow.nachResponse.responseRateByDay, random);
  const incident = bankRow.upiIncidents;
  let outageActive = false;
  let outageDurationMs = 0;
  if (rail === 'UPI AutoPay' && category === 'technical' && incident.incidentCount > 0) {
    const [year, monthNumber] = month.period.split('-').map(Number);
    const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    const downtimeFraction = incident.downtimeMinutes / (days * 1440);
    const conditional = bankRow.autopay.technicalDeclineRate ? Math.min(1, downtimeFraction / bankRow.autopay.technicalDeclineRate) : 0;
    outageActive = random() < conditional;
    // ASSUMPTION: exact incident timestamps are not published. An active
    // incident starts at evaluation time and lasts the observed monthly mean.
    outageDurationMs = outageActive
      ? (incident.downtimeMinutes / incident.incidentCount) * 60 * 1000 * factorFor(perturbation, 'outage_duration')
      : 0;
  }
  const bankBaselineDeclineRate = calibration.bankBaselines[bankRow.bank].totalDeclineRate;
  const normalBankDeclineRate = bankRow.autopay.businessDeclineRate + bankRow.autopay.technicalDeclineRate;
  const bankDeclineRate = outageActive
    ? bankBaselineDeclineRate * calibration.incidentDeviationMultiplier
    : normalBankDeclineRate;
  return {
    period: month.period,
    bank: bankRow.bank,
    category,
    responseLagDays,
    responseAvailableAt: now + responseLagDays * DAY_MS,
    outageActive,
    outageClearsAt: outageActive ? now + outageDurationMs : now - DAY_MS,
    bankBaselineDeclineRate,
    normalBankDeclineRate,
    bankDeclineRate,
    bankDeclineDeviation: bankDeclineRate / bankBaselineDeclineRate,
    incidentDeviationMultiplier: calibration.incidentDeviationMultiplier,
    observed: bankRow,
  };
}

export const npciCalibration = calibration;
