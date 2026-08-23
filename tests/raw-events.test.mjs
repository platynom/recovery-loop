import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { containsContactOrEmailField } from '../scripts/lib/redact-captured-event.mjs';

const directory = fileURLToPath(new URL('../data/raw_events/', import.meta.url));

test('all committed captured events are redacted and retain the observed tuple', async () => {
  const files = (await readdir(directory)).filter((name) => name.endsWith('.json')).sort();
  assert.equal(files.length, 15, 'expected all 15 captured Razorpay test events');
  for (const file of files) {
    const event = JSON.parse(await readFile(`${directory}${file}`, 'utf8'));
    assert.equal(containsContactOrEmailField(event), false, `${file} contains a contact or email field`);
    assert.deepEqual(
      [event.error_code, event.error_source, event.error_step, event.error_reason],
      ['BAD_REQUEST_ERROR', 'business', 'payment_initiation', 'international_transaction_not_allowed'],
    );
  }
});
