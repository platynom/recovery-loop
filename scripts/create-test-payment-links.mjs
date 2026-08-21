import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { razorpayRequest } from './lib/razorpay-test-client.mjs';

const requested = Number(process.argv[2] ?? process.env.TEST_FAILURE_TARGET ?? 20);
if (!Number.isInteger(requested) || requested < 1 || requested > 30) throw new Error('Choose an integer from 1 to 30. Razorpay documents a 30 Payment Link test-mode limit per business.');

const runId = `genuine-test-${new Date().toISOString().replace(/[:.]/g, '-')}`;
const startedAt = Math.floor(Date.now() / 1000);
const links = [];

for (let index = 0; index < requested; index += 1) {
  const sequence = index + 1;
  const referenceId = `rl-${Date.now().toString(36)}-${String(sequence).padStart(2, '0')}`;
  const link = await razorpayRequest('/payment_links', {
    method: 'POST',
    body: JSON.stringify({
      amount: 29900 + (index % 5) * 10000,
      currency: 'INR',
      accept_partial: false,
      reference_id: referenceId,
      description: `Recovery Loop genuine test failure ${sequence}/${requested}`,
      reminder_enable: false,
      notes: { recovery_loop_run: runId, recovery_loop_sequence: String(sequence), expected_result: 'failure' },
    }),
  });
  links.push({ sequence, referenceId, id: link.id, shortUrl: link.short_url, amount: link.amount, status: link.status });
  console.log(`[${sequence}/${requested}] ${link.short_url}`);
}

const runDirectory = resolve('data', 'test_runs');
await mkdir(runDirectory, { recursive: true });
const manifestPath = resolve(runDirectory, `${runId}.json`);
await writeFile(manifestPath, `${JSON.stringify({ runId, startedAt, target: requested, links }, null, 2)}\n`, 'utf8');
console.log(`Manifest: ${manifestPath}`);
