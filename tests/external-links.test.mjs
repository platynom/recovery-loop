import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/* Every outbound link on the site must be one we have verified resolves.
   A 404 in front of a judge is worse than a missing citation, so the
   allowlist is explicit: adding a link means verifying it first. */
const VERIFIED = new Set([
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
