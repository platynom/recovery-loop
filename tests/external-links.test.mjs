import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/* Every outbound link on the site must be one we have verified resolves.
   A 404 in front of a judge is worse than a missing citation, so the
   allowlist is explicit: adding a link means verifying it first. */
const VERIFIED = new Set([
  // Opened and checked on 5 September 2026: live UPI AutoPay product page, including Intelligent Retry Mechanism.
  'https://razorpay.com/upi-autopay/',
  'https://razorpay.com/docs/payments/subscriptions/payment-retries/',
  'https://razorpay.com/docs/payments/optimizer/recurring-payments/',
  'https://razorpay.com/docs/payments/optimizer/dynamic-routing/',
  'https://github.com/platynom/recovery-loop',
  'https://github.com/platynom/recovery-loop/tree/master/data/evaluation',
  'https://github.com/platynom/recovery-loop/tree/master/docs/recording-assets',
  'https://github.com/platynom/recovery-loop/blob/master/docs/LIMITATIONS.md',
  'https://razorpay.com/agent-studio/',
  'https://www.npci.org.in/product/ecosystem-statistics/autopay',
  'https://github.com/platynom/recovery-loop/tree/master/data/raw_events',
  'https://github.com/platynom/recovery-loop/blob/master/data/npci/autopay-payer-psp-execution-2025-01_to_2026-07-fetched-2026-08-22.json',
  'https://github.com/platynom/recovery-loop/blob/master/data/npci/nach-destination-bank-returns-2025-01_to_2026-06-fetched-2026-08-22.json',
  'https://www.ons.gov.uk/economy/economicoutputandproductivity/output/datasets/monthlydirectdebitfailurerateandaveragetransactionamount',
]);

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(e)) out.push(p);
  }
  return out;
}

test('every outbound link in app/ is on the verified list', () => {
  const found = new Set();
  for (const f of walk('app')) {
    for (const m of readFileSync(f, 'utf8').matchAll(/href="(https?:\/\/[^"]+)"/g)) found.add(m[1]);
  }
  const unverified = [...found].filter((u) => !VERIFIED.has(u));
  assert.deepEqual(unverified, [], `Unverified outbound link(s): ${unverified.join(', ')}`);
});
