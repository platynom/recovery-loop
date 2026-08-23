import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { containsContactOrEmailField, redactCapturedEvent } from './lib/redact-captured-event.mjs';

const directory = resolve('data', 'raw_events');
const files = (await readdir(directory)).filter((name) => name.endsWith('.json')).sort();
for (const file of files) {
  const path = resolve(directory, file);
  const event = JSON.parse(await readFile(path, 'utf8'));
  const redacted = redactCapturedEvent(event);
  if (containsContactOrEmailField(redacted)) throw new Error(`Redaction failed for ${file}`);
  await writeFile(path, `${JSON.stringify(redacted, null, 2)}\n`, 'utf8');
}
console.log(`Redacted ${files.length} captured Razorpay test events.`);
