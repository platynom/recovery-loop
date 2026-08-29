import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(root, 'data/npci');
const sources = {
  autopay: 'autopay-payer-psp-execution-2025-01_to_2026-07-fetched-2026-08-22.json',
  returns: 'nach-destination-bank-returns-2025-01_to_2026-06-fetched-2026-08-22.json',
  response: 'nach-destination-bank-response-2025-01_to_2026-06-fetched-2026-08-22.json',
  incidents: 'upi-downtime-incidents-2025-01_to_2026-07-fetched-2026-08-22.json',
};
const raw = Object.fromEntries(Object.entries(sources).map(([key, file]) => [key, JSON.parse(readFileSync(resolve(dir, file), 'utf8'))]));
const months = { Jan: 1, January: 1, Feb: 2, February: 2, Mar: 3, March: 3, Apr: 4, April: 4, May: 5, Jun: 6, June: 6, Jul: 7, July: 7, Aug: 8, August: 8, Sep: 9, September: 9, Oct: 10, October: 10, Nov: 11, November: 11, Dec: 12, December: 12 };
const targetBanks = ['HDFC', 'SBI', 'ICICI', 'Axis'];

function periodKey(period) { return `${period.year}-${String(months[period.month]).padStart(2, '0')}`; }
function number(value) { const n = Number(String(value ?? '').replaceAll(',', '').replace('%', '').trim()); return Number.isFinite(n) ? n : 0; }
function rate(value) { return number(value) / 100; }
function bankName(value = '') {
  const name = value.toUpperCase();
  if (name.includes('HDFC')) return 'HDFC';
  if (name.includes('STATE BANK') || /^SBI\b/.test(name)) return 'SBI';
  if (name.includes('ICICI')) return 'ICICI';
  if (name.includes('AXIS')) return 'Axis';
  return null;
}
function indexPeriods(dataset, mapper) {
  const result = new Map();
  for (const period of dataset.periods) {
    const key = periodKey(period);
    const rows = new Map();
    for (const row of period.rows) {
      const bank = bankName(row[1]);
      if (bank) rows.set(bank, mapper(row)); // De-duplicates UI repeats deterministically.
    }
    result.set(key, rows);
  }
  return result;
}

const autopay = indexPeriods(raw.autopay, (row) => ({ volumeMillions: number(row[2]), approvedRate: rate(row[3]), businessDeclineRate: rate(row[4]), technicalDeclineRate: rate(row[5]) }));
const returns = indexPeriods(raw.returns, (row) => ({ volumeMillions: number(row[2]), successRate: rate(row[3]), financialBusinessDeclineRate: rate(row[4]), nonFinancialBusinessDeclineRate: rate(row[5]) }));
const response = indexPeriods(raw.response, (row) => ({ volumeMillions: number(row[2]), responseRateByDay: [row[3], row[4], row[5], row[6], row[7]].map(rate) }));
const incidents = indexPeriods(raw.incidents, (row) => {
  const [hours, minutes] = String(row[3] ?? '0:0').split(':').map(Number);
  return { incidentCount: number(row[2]), downtimeMinutes: hours * 60 + minutes };
});

const commonPeriods = [...autopay.keys()].filter((key) => returns.has(key) && response.has(key)).sort();
const periods = commonPeriods.map((period) => ({
  period,
  banks: targetBanks.map((bank) => {
    const ap = autopay.get(period)?.get(bank);
    const nr = returns.get(period)?.get(bank);
    const resp = response.get(period)?.get(bank);
    if (!ap || !nr || !resp) throw new Error(`Missing ${bank} calibration row for ${period}`);
    return { bank, autopay: ap, nachReturns: nr, nachResponse: resp, upiIncidents: incidents.get(period)?.get(bank) ?? { incidentCount: 0, downtimeMinutes: 0 } };
  }),
}));

const bankBaselines = Object.fromEntries(targetBanks.map((bank) => {
  const rows = periods.map((period) => period.banks.find((row) => row.bank === bank));
  const volume = rows.reduce((sum, row) => sum + row.autopay.volumeMillions, 0);
  const weighted = (selector) => rows.reduce((sum, row) => sum + row.autopay.volumeMillions * selector(row), 0) / volume;
  return [bank, {
    totalDeclineRate: weighted((row) => row.autopay.businessDeclineRate + row.autopay.technicalDeclineRate),
    technicalDeclineRate: weighted((row) => row.autopay.technicalDeclineRate),
  }];
}));

// Freeze the outage trigger before policy evaluation. NPCI incident totals are
// monthly, so short incidents are often diluted to no visible monthly TD rise.
// Among reportable incident months that DO show a bank-normalized TD elevation,
// use the smallest observed multiple as the conservative detectable spike.
const detectableIncidentMultiples = periods.flatMap((period) => period.banks.flatMap((row) => {
  const baseline = bankBaselines[row.bank].technicalDeclineRate;
  const multiple = baseline ? row.autopay.technicalDeclineRate / baseline : 0;
  return row.upiIncidents.incidentCount > 0 && multiple > 1 ? [multiple] : [];
}));
if (!detectableIncidentMultiples.length) throw new Error('No reportable NPCI incident month has a detectable AutoPay TD elevation');
const incidentDeviationMultiplier = Math.min(...detectableIncidentMultiples);

const output = {
  generatedAt: '2026-08-22',
  fetchDate: '2026-08-22',
  commonPeriodRange: `${commonPeriods[0]} to ${commonPeriods.at(-1)}`,
  sources: Object.fromEntries(Object.entries(sources).map(([key, file]) => [key, { file, sourceUrl: raw[key].sourceUrl, canonicalSourceUrl: raw[key].canonicalSourceUrl ?? raw[key].sourceUrl }])),
  notes: [
    'AutoPay payer-PSP approval, business-decline and technical-decline rates are published NPCI observations.',
    'NACH financial/non-financial return shares and T+0..T+4 response shares are published NPCI observations.',
    'UPI incident counts and downtime are NPCI reportable incidents only; absence is not proof of zero downtime.',
    'The simulator conditions on an already-failed cohort; volume multiplied by observed decline rate supplies bank/month sampling weight.',
    `The bank-health outage trigger is frozen at ${incidentDeviationMultiplier.toFixed(6)}x each bank's own baseline: the smallest visible TD elevation among NPCI reportable-incident months.`,
    'Reportable incidents without a visible monthly TD elevation are acknowledged as aggregation dilution and do not lower the trigger.',
  ],
  bankBaselines,
  incidentDeviationMultiplier,
  periods,
};
writeFileSync(resolve(dir, 'calibration-2026-08-22.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${periods.length} months x ${targetBanks.length} banks to data/npci/calibration-2026-08-22.json`);
