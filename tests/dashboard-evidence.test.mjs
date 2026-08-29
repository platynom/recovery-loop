import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function json(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
}

test('observations are recorded as diagnostic tuples, not generic error codes', async () => {
  const taxonomy = await json('../data/failure_taxonomy.json');
  assert.equal(Object.hasOwn(taxonomy, 'observed_codes'), false);
  assert.deepEqual(taxonomy.observed_tuples, [{
    error_source: 'business',
    error_step: 'payment_initiation',
    error_reason: 'international_transaction_not_allowed',
    count: 15,
    source: 'razorpay_test_payments_api',
    captured_on: '2026-08-22',
  }]);
});

test('final dashboard evidence supports both efficiency leads and revenue losses', async () => {
  const evidence = await json('../data/evaluation/fix7-npci-calibrated.json');
  const rails = [
    [evidence.reportedRails.upiNpcCalibrated, 1.9],
    [evidence.reportedRails.cardsUncalibrated, 1.7],
  ];

  for (const [rail, expectedRatio] of rails) {
    const loop = rail.policies.find((policy) => policy.name === 'Recovery Loop');
    const ladder = rail.policies.find((policy) => policy.name !== 'Recovery Loop');
    const ratio = (loop.grossRevenue.mean / loop.attempts.mean) / (ladder.grossRevenue.mean / ladder.attempts.mean);
    assert.equal(Number(ratio.toFixed(1)), expectedRatio);
    assert.ok(loop.grossRevenue.mean < ladder.grossRevenue.mean);
    assert.ok(loop.unusedAttemptsAtHorizon.mean > ladder.unusedAttemptsAtHorizon.mean);
    assert.equal(rail.seedsWonByRecoveryLoop, 0);
    assert.equal(rail.perSeed.length, evidence.seeds.length);
  }
});
