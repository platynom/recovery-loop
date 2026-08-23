import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { razorpayRequest } from './lib/razorpay-test-client.mjs';
import { redactCapturedEvent } from './lib/redact-captured-event.mjs';

const runDirectory = resolve('data', 'test_runs');
const requestedManifest = process.argv[2];
let manifestPath;
if (requestedManifest) manifestPath = resolve(requestedManifest);
else {
  const manifests = (await readdir(runDirectory)).filter((name) => name.endsWith('.json')).sort();
  if (!manifests.length) throw new Error('No test-run manifest exists. Run npm run test-lab:create first.');
  manifestPath = resolve(runDirectory, manifests.at(-1));
}
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const outputDirectory = resolve('data', 'raw_events');
await mkdir(outputDirectory, { recursive: true });

const response = await razorpayRequest(`/payments?from=${manifest.startedAt}&count=100&skip=0`, { method: 'GET' });
const failed = (response.items ?? []).filter((payment) => payment.status === 'failed' && payment.notes?.recovery_loop_run === manifest.runId);
for (const payment of failed) {
  const outputPath = resolve(outputDirectory, `${payment.id}.observed-api.json`);
  await writeFile(outputPath, `${JSON.stringify(redactCapturedEvent(payment), null, 2)}\n`, 'utf8');
}
const summary = { runId: manifest.runId, manifest: basename(manifestPath), target: manifest.target, observedFailures: failed.length, paymentIds: failed.map((payment) => payment.id), collectedAt: new Date().toISOString(), source: 'Razorpay Test Payments API' };
await writeFile(resolve(runDirectory, `${manifest.runId}.collection.json`), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(summary, null, 2));
if (failed.length < manifest.target) process.exitCode = 2;
