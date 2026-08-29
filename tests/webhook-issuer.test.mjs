import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { canonicalIssuerKey, downtimeIssuerKey, paymentIssuerKey, requireIssuerKey } from '../src/integration/razorpay-issuer.mjs';

test('payment and downtime paths produce one canonical issuer key', () => {
  const payment = { entity: 'payment', card: { issuer: 'HDFC Bank Ltd.' } };
  const downtime = { payload: { 'payment.downtime': { entity: { instrument: { issuer: 'HDFC' } } } } };
  assert.equal(paymentIssuerKey(payment), 'HDFC');
  assert.equal(downtimeIssuerKey(downtime), 'HDFC');
  assert.equal(canonicalIssuerKey('State Bank of India'), 'SBI');
});

test('captured event without issuer fails loudly instead of guessing from an id', async () => {
  const path = fileURLToPath(new URL('../data/raw_events/pay_TSlJ4RTwMIjdYO.observed-api.json', import.meta.url));
  const captured = JSON.parse(await readFile(path, 'utf8'));
  assert.equal(paymentIssuerKey(captured), null);
  assert.throws(() => requireIssuerKey(paymentIssuerKey(captured), captured.id), /issuer_health_join_failed.*no issuer identifier.*refusing to guess/);
});
