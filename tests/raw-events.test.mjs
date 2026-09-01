import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { containsContactOrEmailField } from '../scripts/lib/redact-captured-event.mjs';

const directory = fileURLToPath(new URL('../data/raw_events/', import.meta.url));

test('all committed captured events are redacted and match the observed inventory', async () => {
  const files = (await readdir(directory)).filter((name) => name.endsWith('.json')).sort();
  assert.equal(files.length, 20, 'expected all 20 captured Razorpay test API entities');
  const events = [];
  for (const file of files) {
    const event = JSON.parse(await readFile(`${directory}${file}`, 'utf8'));
    assert.equal(containsContactOrEmailField(event), false, `${file} contains a contact or email field`);
    events.push(event);
  }
  assert.equal(events.filter((event) => event.status === 'failed').length, 16);
  assert.equal(events.filter((event) => event.status === 'captured').length, 3);
  assert.equal(events.filter((event) => event.status === 'created').length, 1);
  assert.equal(events.filter((event) => event.error_source === 'business' && event.error_step === 'payment_initiation' && event.error_reason === 'international_transaction_not_allowed').length, 15);
  assert.equal(events.filter((event) => event.error_source === 'gateway' && event.error_step === 'payment_authorization' && event.error_reason === 'payment_failed').length, 1);
  assert.equal(events.filter((event) => event.card?.issuer === 'DCBL').length, 5);
});
