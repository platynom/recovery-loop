import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { decideRecovery } from '../src/policy/scheduler.mjs';

const fixturesDirectory = fileURLToPath(new URL('../data/raw_events/', import.meta.url));

function toFailureEvent(payment) {
  const createdAt = Number(payment.created_at) * 1000;
  const date = new Date(createdAt);
  return {
    id: String(payment.id),
    createdAt,
    amount: Number(payment.amount ?? 0) / 100,
    bank: String(payment.bank ?? 'Unknown'),
    rail: payment.method === 'upi' ? 'UPI AutoPay' : payment.method === 'card' ? 'Cards' : 'eMandate',
    errorCode: String(payment.error_code ?? ''),
    errorDescription: String(payment.error_description ?? ''),
    errorSource: String(payment.error_source ?? ''),
    errorStep: String(payment.error_step ?? ''),
    errorReason: String(payment.error_reason ?? ''),
    attemptNumber: 1,
    issuerStop: false,
    outageActive: false,
    bankDeclineRate: 0.03,
    hour: date.getUTCHours(),
    dayOfMonth: date.getUTCDate(),
  };
}

test('captured permanent business failures schedule zero retries', async () => {
  const fixtureNames = (await readdir(fixturesDirectory)).filter((name) => name.endsWith('.json'));
  assert.ok(fixtureNames.length > 0, 'expected captured Razorpay events');

  const payments = await Promise.all(fixtureNames.map(async (name) => {
    const payment = JSON.parse(await readFile(`${fixturesDirectory}${name}`, 'utf8'));
    return payment;
  }));
  const permanentFailures = payments.filter((payment) => payment.error_source === 'business' && payment.error_step === 'payment_initiation');
  const decisions = permanentFailures.map((payment) => decideRecovery(toFailureEvent(payment), {}, Date.UTC(2026, 7, 22, 6)));

  assert.equal(permanentFailures.length, 15);
  assert.equal(decisions.filter((decision) => decision.action === 'retry').length, 0);
  assert.ok(decisions.every((decision) => decision.probability === 0));
  assert.ok(decisions.every((decision) => decision.action === 'refuse_terminal' && decision.scheduledAt === null));
});
