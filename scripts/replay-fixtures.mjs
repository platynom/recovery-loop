import { readFile } from 'node:fs/promises';

const baseUrl = process.env.RECOVERY_LOOP_URL ?? 'http://localhost:3000';
const files = ['downtime-started.json', 'payment-failed.json', 'downtime-resolved.json'];

for (const file of files) {
  const body = await readFile(new URL(`../data/fixtures/${file}`, import.meta.url), 'utf8');
  const response = await fetch(`${baseUrl}/api/webhooks/razorpay`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-recovery-loop-fixture': '1' }, body });
  const result = await response.json();
  console.log(file, response.status, result);
  if (!response.ok) process.exitCode = 1;
}
