import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function json(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
}

test('observations are recorded as diagnostic tuples, not generic error codes', async () => {
  const taxonomy = await json('../data/failure_taxonomy.json');
  assert.equal(Object.hasOwn(taxonomy, 'observed_codes'), false);
  assert.deepEqual(taxonomy.observed_tuples, [
    {
      error_source: 'business',
      error_step: 'payment_initiation',
      error_reason: 'international_transaction_not_allowed',
      count: 15,
      source: 'razorpay_test_payments_api',
      captured_on: '2026-08-22',
    },
    {
      error_source: 'gateway',
      error_step: 'payment_authorization',
      error_reason: 'payment_failed',
      count: 1,
      source: 'razorpay_test_payments_api',
      captured_on: '2026-09-01',
    },
  ]);
});

test('dashboard headline uses frozen-cap held-out validation', async () => {
  const evidence = await json('../data/evaluation/heldout-cap-validation.json');
  assert.equal(evidence.runCount, 1);
  assert.equal(evidence.frozenCapDays, 14);
  const upi = evidence.primaryResult.rails.find((rail) => rail.rail === 'UPI AutoPay');
  const cards = evidence.primaryResult.rails.find((rail) => rail.rail === 'Cards');
  assert.equal(upi.seedsWonByRecoveryLoop, 10);
  assert.ok(upi.pairedNetDifference.min > 0);
  assert.equal(cards.seedsWonByRecoveryLoop, 6);
  assert.ok(cards.pairedNetDifference.min < 0 && cards.pairedNetDifference.max > 0);
  assert.ok(upi.recoveryLoop.strandedAttempts.mean > upi.fixedLadder.strandedAttempts.mean);
  assert.ok(cards.recoveryLoop.strandedAttempts.mean > cards.fixedLadder.strandedAttempts.mean);
});
