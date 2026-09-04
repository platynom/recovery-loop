import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const calibrationPath = resolve(root, 'data/npci/calibration-2026-08-22.json');
const calibration = JSON.parse(readFileSync(calibrationPath, 'utf8'));
const observations = calibration.periods.flatMap((period) => period.banks.map((entry) => ({
  period: period.period,
  bank: entry.bank,
  volume: entry.autopay.volumeMillions,
  approved: entry.autopay.approvedRate,
  businessDecline: entry.autopay.businessDeclineRate,
  technicalDecline: entry.autopay.technicalDeclineRate,
})));

const identityErrors = observations.map((row) => ({ ...row, error: Math.abs(row.approved - (1 - row.businessDecline - row.technicalDecline)) }));
const maxIdentityRoundingError = Math.max(...identityErrors.map((row) => row.error));
const publishedRoundingTolerance = 0.00011;
if (maxIdentityRoundingError > publishedRoundingTolerance) {
  const row = identityErrors.find((candidate) => candidate.error === maxIdentityRoundingError);
  throw new Error(`${row.period}/${row.bank} violates approved = 1 - BD - TD beyond the published-rounding tolerance: ${row.error}`);
}

function weightedRate(rows, field) {
  const volume = rows.reduce((sum, row) => sum + row.volume, 0);
  return rows.reduce((sum, row) => sum + row.volume * row[field], 0) / volume;
}

const pooled = {
  volumeMillions: observations.reduce((sum, row) => sum + row.volume, 0),
  approvedRate: weightedRate(observations, 'approved'),
  businessDeclineRate: weightedRate(observations, 'businessDecline'),
  technicalDeclineRate: weightedRate(observations, 'technicalDecline'),
};
const banks = [...new Set(observations.map((row) => row.bank))].sort();
const fittedBanks = Object.fromEntries(banks.map((bank) => {
  const rows = observations.filter((row) => row.bank === bank);
  const approvedRate = weightedRate(rows, 'approved');
  const businessDeclineRate = weightedRate(rows, 'businessDecline');
  const technicalDeclineRate = weightedRate(rows, 'technicalDecline');
  return [bank, {
    volumeMillions: rows.reduce((sum, row) => sum + row.volume, 0),
    approvedRate,
    businessDeclineRate,
    technicalDeclineRate,
    probabilityAdjustment: approvedRate - pooled.approvedRate,
  }];
}));

const output = {
  generatedAt: new Date().toISOString(),
  source: 'data/npci/calibration-2026-08-22.json',
  sourceFetchDate: calibration.fetchDate,
  periodRange: calibration.commonPeriodRange,
  method: 'For each payer-PSP bank, compute the AutoPay-volume-weighted approved rate over the common window and subtract the all-bank pooled volume-weighted approved rate. Validate approved = 1 - business decline - technical decline for every row. Apply the centered additive effect only to NPCI-calibrated UPI events.',
  identityValidation: { maxIdentityRoundingError, publishedRoundingTolerance },
  interpretation: 'Published initial-approval relative bank effect used as a proxy adjustment; not a fitted repeat-attempt recovery rate.',
  pooled,
  banks: fittedBanks,
};
const outputPath = resolve(root, 'data/npci/predictor-bank-adjustments-2026-09-04.json');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
