import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadTestCredentials, razorpayRequest } from './lib/razorpay-test-client.mjs';

const manifestPath = resolve(process.argv[2] ?? '');
const sequence = Number(process.argv[3]);
const { keyId } = loadTestCredentials();
if (!keyId.startsWith('rzp_test_')) throw new Error('ABORT: checkout key is not an rzp_test_ key.');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (manifest.keyId !== keyId) throw new Error('ABORT: manifest key does not match the configured test key.');
const order = manifest.orders.find((candidate) => candidate.sequence === sequence);
if (!order) throw new Error(`No Checkout order for sequence ${sequence}.`);
const remote = await razorpayRequest(`/orders/${order.id}`, { method: 'GET' });
if (remote.notes?.recovery_loop_run !== manifest.runId) throw new Error('ABORT: remote Order does not belong to this guarded test run.');
if (!['created', 'attempted'].includes(remote.status)) throw new Error(`ABORT: Order status is ${remote.status}.`);
console.log(JSON.stringify({ testKeyAsserted: true, sequence, orderId: remote.id, status: remote.status }));
