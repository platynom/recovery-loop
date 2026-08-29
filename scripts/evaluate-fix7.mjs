import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateNpcCalibratedRails, evaluatePerMandateRails, evaluationSeeds } from '../eval/evaluate.mjs';
import calibration from '../data/npci/calibration-2026-08-22.json' with { type: 'json' };

const now = Date.UTC(2026, 7, 22, 6, 0, 0);
const options = { count: 2000, seeds: evaluationSeeds, now };
const correctedSynthetic = evaluatePerMandateRails(options);
const calibrated = evaluateNpcCalibratedRails(options);
const cardsUncalibrated = correctedSynthetic.find((row) => row.rail === 'Cards');
const output = {
  generatedAt: new Date(now).toISOString(),
  fetchDate: calibration.fetchDate,
  seeds: evaluationSeeds,
  cohort: '2,000 already-failed mandates per seed and rail; 30-day horizon; per-mandate non-transferable caps',
  partA: {
    verdict: 'Hard and soft outcomes are now separated: only hard stops terminate; economic and outage decisions wait and re-evaluate.',
    bugHistory: 'Part A correctly stopped scheduled hard refusals, but incorrectly collapsed economic not-worth-it-now decisions into the same terminal action.',
    finalControlFlow: {
      refuseTerminal: 'Issuer/MAC stop, non-retryable diagnosis, exhausted attempt cap, or expired horizon; never revisited.',
      wait: 'Economic or outage/gate deferral; costs no attempt and re-evaluates fresh state inside the existing three-day bound.',
      retry: 'A permitted scheduled authorization attempt; consumes one mandate-local token.',
    },
    correctedSynthetic,
  },
  supersededFix7Artifact: {
    status: 'invalidated by absolute-baseline gate, invalid NACH-to-Cards calibration, and unconditional original-failure penalty',
    upiPairedNetDifferenceMean: -2096896.366,
    cardsPairedNetDifferenceMean: -2178194.564,
    cardsRecoveryLoopAttemptsMean: 0,
  },
  npcCalibration: {
    periodRange: calibration.commonPeriodRange,
    sources: calibration.sources,
    backedByPublishedNpcData: [
      'Payer-PSP bank names and monthly AutoPay volume',
      'Monthly AutoPay approved, business-decline and technical-decline rates',
      'Monthly NACH destination-bank success and financial/non-financial business-decline shares',
      'Monthly NACH destination-bank response timing at T+0 through T+4',
      'Monthly UPI reportable incident counts and total downtime',
      `Each bank's volume-weighted AutoPay baseline decline rate over ${calibration.commonPeriodRange}`,
      `Incident deviation trigger ${calibration.incidentDeviationMultiplier.toFixed(6)}x, the smallest visible bank-normalized TD elevation in a reportable-incident month`,
    ],
    remainingAssumptions: [
      'The evaluation conditions on an already-failed cohort rather than simulating original approvals.',
      'Synthetic payment amounts and hidden customer salary dates.',
      'Hidden repeat-attempt success rules by failure category and deterministic outcome draws.',
      'Uniform month sampling; within-month failed-cohort bank weighting uses volume times observed decline rate.',
      'Cards have no NPCI calibration: no public India card-authorization decline baseline was found, so Cards use only the labelled uncalibrated simulator.',
      'NACH financial/non-financial returns and response timing are used only as UPI soft/hard and response-availability proxies.',
      'NACH financial decline is treated as soft/insufficient-funds and non-financial decline as hard.',
      'Hard-decline subtype allocation retains the frozen 12:9:5:2 issuer/customer/mandate/configuration ratio.',
      'NPCI publishes incident totals, not timestamps; active incidents are placed at evaluation time and use observed mean duration.',
      'No undocumented Cards outage is synthesized.',
      'Retry costs, decline-rate penalty, card MAC mapping, probability model and policy thresholds remain frozen scenario assumptions.',
    ],
  },
  reportedRails: {
    upiNpcCalibrated: calibrated[0],
    cardsUncalibrated,
  },
};
const path = resolve(dirname(fileURLToPath(import.meta.url)), '../data/evaluation/fix7-npci-calibrated.json');
mkdirSync(dirname(path), { recursive: true });
writeFileSync(path, `${JSON.stringify(output, null, 2)}\n`);
const fix6Path = resolve(dirname(fileURLToPath(import.meta.url)), '../data/evaluation/fix6-per-mandate.json');
writeFileSync(fix6Path, `${JSON.stringify({ generatedAt: new Date(now).toISOString(), seeds: evaluationSeeds, correction: 'Final hard-terminal versus economic-wait control-flow correction', perMandateRails: correctedSynthetic }, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
