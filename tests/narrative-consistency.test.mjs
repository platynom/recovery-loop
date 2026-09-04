import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const text = (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await text(path));
test('recording narratives agree with final evidence and external benchmarks', async () => {
  const [readme, video, results, limitations, recordingNumbers, protocol, onsNotes, onsCsv, heldout, capSweep, sensitivity] = await Promise.all([
    text('README.md'), text('docs/VIDEO_SCRIPT.md'), text('docs/EVALUATION_RESULTS.md'),
    text('docs/LIMITATIONS.md'), text('docs/RECORDING_NUMBERS.md'), text('docs/EVALUATION.md'),
    text('data/external/ons-direct-debit-failures.md'),
    text('data/external/ons-direct-debit-failures.csv'), json('data/evaluation/heldout-cap-validation.json'),
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

  assert.deepEqual(heldout.seeds, [20260906, 20260907, 20260908, 20260909, 20260910, 20260911, 20260912, 20260913, 20260914, 20260915]);
  assert.equal(heldout.runCount, 1);
  assert.equal(heldout.frozenCapDays, 14);
  assert.match(protocol, /20260901.*20260902.*20260903.*20260904.*20260905/s);
  assert.match(protocol, /20260906.*20260915/s);
  const upi = heldout.primaryResult.rails.find((rail) => rail.rail === 'UPI AutoPay');
  const cards = heldout.primaryResult.rails.find((rail) => rail.rail === 'Cards');
  assert.equal(upi.seedsWonByRecoveryLoop, 10);
  assert.equal(cards.seedsWonByRecoveryLoop, 6);
  assert.ok(cards.pairedNetDifference.min < 0 && cards.pairedNetDifference.max > 0);

  for (const document of [readme, video, results, recordingNumbers]) {
    for (const value of ['4,491.4', '1,230.4', '5,406.3', '838.5', '₹2,857,357.83', '₹1,789,083.60', '₹1,068,274.23']) {
      assert.ok(document.includes(value), `headline narrative missing UPI validation value ${value}`);
    }
    assert.match(document, /10\/10|ten validation seeds|all ten/i);
    assert.match(document, /Cards is (?:\*\*)?inconclusive|Cards conclusion.*inconclusive/i);
    assert.ok(!/Cards wins?\b/i.test(document), 'Cards must not be described as winning');
  }
  for (const document of [readme, results, recordingNumbers]) {
    for (const value of ['2,674.1', '1,071.4', '3,527.4', '1,065.2', '₹20,766.87', '1,783.8']) {
      assert.ok(document.includes(value), `written narrative missing Cards validation value ${value}`);
    }
  }
  assert.match(limitations, /42%.*70%.*28-point/s);
  assert.match(readme, /76%.*3 retries in 4 weeks.*1,000\+.*November 2019/s);

  const validationWins = heldout.robustnessCurve.map((point) => ({
    cap: point.capDays,
    upi: point.rails.find((rail) => rail.rail === 'UPI AutoPay').seedsWonByRecoveryLoop,
    cards: point.rails.find((rail) => rail.rail === 'Cards').seedsWonByRecoveryLoop,
  }));
  assert.deepEqual(validationWins, [
    { cap: 3, upi: 0, cards: 0 }, { cap: 7, upi: 0, cards: 0 },
    { cap: 14, upi: 10, cards: 6 }, { cap: 21, upi: 10, cards: 0 },
    { cap: 28, upi: 10, cards: 0 }, { cap: 30, upi: 10, cards: 0 },
    { cap: 35, upi: 10, cards: 0 },
  ]);
  assert.ok(capSweep.points.length === 7, 'superseded in-sample curve must remain visible');
  assert.ok(sensitivity.summary.filter((row) => row.scenario !== 'baseline').every((row) => row.seedsWonByRecoveryLoop === 0));

  const captures = (await readdir(new URL('data/raw_events/', root))).filter((name) => name.endsWith('.json'));
  assert.equal(captures.length, 20);
  assert.match(video, /twenty Razorpay test (?:API payment )?entities/);
});
