import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const text = (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await text(path));
const money = (value) => `₹${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const oneDecimal = (value) => Number(value).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const escaped = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function policies(rail) {
  return {
    loop: rail.policies.find((policy) => policy.name === 'Recovery Loop'),
    ladder: rail.policies.find((policy) => policy.name !== 'Recovery Loop'),
  };
}

test('recording narratives agree with final evidence and external benchmarks', async () => {
  const [readme, video, results, limitations, recordingNumbers, onsNotes, onsCsv, evidence, capSweep, sensitivity] = await Promise.all([
    text('README.md'), text('docs/VIDEO_SCRIPT.md'), text('docs/EVALUATION_RESULTS.md'),
    text('docs/LIMITATIONS.md'), text('docs/RECORDING_NUMBERS.md'),
    text('data/external/ons-direct-debit-failures.md'),
    text('data/external/ons-direct-debit-failures.csv'), json('data/evaluation/fix7-npci-calibrated.json'),
    json('data/evaluation/deferral-cap-sweep.json'), json('data/evaluation/ground-truth-sensitivity.json'),
  ]);
  const narratives = [readme, video, results, limitations, recordingNumbers, onsNotes];
  const staleOnsValue = new RegExp('(?<!\\d)' + '2' + '\\.' + '33' + '(?:%|\\b)');
  assert.ok(narratives.every((document) => !staleOnsValue.test(document)), 'stale ONS value survives');
  assert.ok(narratives.every((document) => !/6,723\s+(?:versus|vs\.?)[^\n]*445|15[×x]\s+more NPCI-prohibited/i.test(document)), 'untraceable compliance multiplier survives');

  const onsRows = onsCsv.trim().split(/\r?\n/).slice(1);
  assert.ok(onsRows.includes('2025-08,"Total",0.0226,103.63'));
  assert.ok(onsRows.includes('2025-08,"Fitness facilities",0.0574,32.14'));
  for (const document of [readme, onsNotes]) {
    assert.match(document, /2\.26% Total/);
    assert.match(document, /5\.74% Fitness facilities/);
    assert.match(document, /August 2025/);
    assert.match(document, /non-seasonally adjusted/i);
    assert.match(document, /2026 edition/i);
  }

  const upi = evidence.reportedRails.upiNpcCalibrated;
  const cards = evidence.reportedRails.cardsUncalibrated;
  for (const [rail, ratio, wordRatio] of [[upi, 1.9, 'one-point-nine'], [cards, 1.7, 'one-point-seven']]) {
    const { loop, ladder } = policies(rail);
    const computed = (loop.grossRevenue.mean / loop.attempts.mean) / (ladder.grossRevenue.mean / ladder.attempts.mean);
    assert.equal(Number(computed.toFixed(1)), ratio);
    assert.match(readme, new RegExp(`${ratio}x`));
    assert.match(video, new RegExp(wordRatio));
    for (const document of [readme, results]) {
      assert.match(document, new RegExp(escaped(oneDecimal(loop.attempts.mean))));
      assert.match(document, new RegExp(escaped(oneDecimal(loop.recovered.mean))));
      assert.match(document, new RegExp(escaped(money(loop.grossRevenue.mean))));
      assert.match(document, new RegExp(escaped(oneDecimal(loop.unusedAttemptsAtHorizon.mean))));
      assert.match(document, new RegExp(escaped(money(Math.abs(rail.pairedNetDifference.mean)))));
      assert.match(document, /0\/5/);
    }
  }

  for (const value of ['1,915.4', '546', '5,426.6', '828', '₹1,446,109.38', '₹2,198,920.72', '811.6', '1,070.2']) {
    assert.ok(readme.includes(value), `README missing camera value ${value}`);
    assert.ok(video.includes(value), `video missing camera value ${value}`);
  }
  for (const referenceOnlyValue of ['3,001.8', '2,960.2']) {
    assert.ok(readme.includes(referenceOnlyValue), `README missing three-day reference value ${referenceOnlyValue}`);
    assert.ok(recordingNumbers.includes(referenceOnlyValue), `recording sheet missing three-day reference value ${referenceOnlyValue}`);
  }
  const upiLoop = policies(upi).loop;
  const capRate = upiLoop.deferralCapHits.mean / upiLoop.deferredMandates.mean * 100;
  assert.equal(Number(capRate.toFixed(1)), 99.8);
  assert.match(readme, /99\.8%/);
  assert.match(video, /ninety-nine-point-eight percent/);
  assert.match(limitations, /42%.*70%.*28-point/s);
  assert.match(readme, /76%.*3 retries in 4 weeks.*1,000\+.*November 2019/s);

  const cap14 = capSweep.points.find((row) => row.capDays === 14);
  const cap30 = capSweep.points.find((row) => row.capDays === 30);
  assert.ok(cap14 && cap30, 'cap sweep must contain 14-day and full-horizon rows');
  const upi14 = cap14.rails.find((row) => row.rail === 'UPI AutoPay');
  const cards14 = cap14.rails.find((row) => row.rail === 'Cards');
  const upi30 = cap30.rails.find((row) => row.rail === 'UPI AutoPay');
  const cards30 = cap30.rails.find((row) => row.rail === 'Cards');
  assert.equal(upi14.seedsWonByRecoveryLoop, 5);
  assert.equal(cards14.seedsWonByRecoveryLoop, 3);
  assert.equal(upi30.seedsWonByRecoveryLoop, 5);
  assert.equal(cards30.seedsWonByRecoveryLoop, 0);
  for (const document of [readme, video, results, recordingNumbers]) {
    assert.match(document, /995,405/);
    assert.match(document, /386,271/);
    assert.match(document, /55\.6/);
  }
  assert.ok(sensitivity.summary.filter((row) => row.scenario !== 'baseline').every((row) => row.seedsWonByRecoveryLoop === 0));

  const captures = (await readdir(new URL('data/raw_events/', root))).filter((name) => name.endsWith('.json'));
  assert.equal(captures.length, 20);
  assert.match(video, /twenty Razorpay test (?:API payment )?entities/);
});
