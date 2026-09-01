import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadTestCredentials, razorpayRequest } from './lib/razorpay-test-client.mjs';

const { keyId } = loadTestCredentials();
if (!keyId.startsWith('rzp_test_')) throw new Error('ABORT: checkout key is not an rzp_test_ key.');
const runId = `genuine-checkout-${new Date().toISOString().replace(/[:.]/g, '-')}`;
const startedAt = Math.floor(Date.now() / 1000);
const runDirectory = resolve('data', 'test_runs');
const manifestPath = resolve(runDirectory, `${runId}.json`);
const scenarios = [
  { sequence: 1, instrument: 'UPI failure@razorpay', amount: 29900 },
  { sequence: 2, instrument: 'Domestic Visa payment_timed_out', amount: 39900 },
  { sequence: 3, instrument: 'Domestic Visa insufficient_fund', amount: 49900 },
  { sequence: 4, instrument: 'Domestic Visa card_declined', amount: 59900 },
  { sequence: 5, instrument: 'Domestic Visa OTP/authentication failure', amount: 69900 },
];
const orders = [];
await mkdir(runDirectory, { recursive: true });

async function save() {
  await writeFile(manifestPath, `${JSON.stringify({ runId, startedAt, target: scenarios.length, keyId, orders }, null, 2)}\n`, 'utf8');
}

for (const scenario of scenarios) {
  const order = await razorpayRequest('/orders', {
    method: 'POST',
    body: JSON.stringify({
      amount: scenario.amount,
      currency: 'INR',
      receipt: `rl-${Date.now().toString(36)}-${scenario.sequence}`,
      notes: {
        recovery_loop_run: runId,
        recovery_loop_sequence: String(scenario.sequence),
        expected_result: 'failure',
        test_instrument: scenario.instrument,
      },
    }),
  });
  orders.push({ ...scenario, id: order.id, status: order.status });
  await save();
  console.log(`[${scenario.sequence}/${scenarios.length}] ${order.id} — ${scenario.instrument}`);
}

console.log(`Manifest: ${manifestPath}`);
