import { createAuditEntry } from '@/src/audit/audit.mjs';
import { normalizeIssuerText } from '@/src/diagnose/taxonomy.mjs';
import { decideRecovery } from '@/src/policy/scheduler.mjs';
import { getRailHealth, persistRawEvent, persistRecoveryRecord, runtimeEnv, setRailHealth } from '@/db/client';

export const dynamic = 'force-dynamic';

type JsonObject = Record<string, unknown>;
const objectValue = (value: unknown): JsonObject => value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : {};

async function hmacHex(body: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqualHex(a: string, b: string) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return difference === 0;
}

function toFailureEvent(payload: JsonObject, now: number) {
  const payloadRoot = objectValue(payload.payload);
  const paymentEntity = objectValue(objectValue(payloadRoot.payment).entity);
  const subscriptionEntity = objectValue(objectValue(payloadRoot.subscription).entity);
  const entity = Object.keys(paymentEntity).length ? paymentEntity : subscriptionEntity;
  const acquirerData = objectValue(entity.acquirer_data);
  const notes = objectValue(entity.notes);
  const inferredBank = String(acquirerData.bank_transaction_id ?? '').slice(0, 4) || 'Unknown';
  const eventType = String(payload.event ?? 'unknown');
  const downtime = eventType.startsWith('payment.downtime.');
  const id = String(entity.id ?? payload.id ?? `evt_${now}`);
  return {
    id,
    createdAt: Number(entity.created_at ? entity.created_at * 1000 : now),
    amount: Number(entity.amount ?? 0) / 100,
    bank: String(entity.bank ?? inferredBank),
    rail: entity.method === 'upi' ? 'UPI AutoPay' : entity.method === 'card' ? 'Cards' : 'eMandate',
    errorCode: String(entity.error_code ?? (downtime ? 'GATEWAY_ERROR' : 'UNKNOWN')),
    errorDescription: normalizeIssuerText(String(entity.error_description ?? entity.error_reason ?? eventType)),
    attemptNumber: Number(notes.recovery_attempt ?? 1),
    issuerStop: /mandate.*(inactive|cancelled)|do.not.retry/i.test(`${entity.error_code ?? ''} ${entity.error_description ?? ''}`),
    outageActive: downtime,
    bankDeclineRate: downtime ? 0.35 : Number(notes.bank_decline_rate ?? 0.03),
    hour: new Date(now).getUTCHours(),
    dayOfMonth: new Date(now).getUTCDate(),
  };
}

function downtimeHealth(payload: JsonObject, now: number) {
  const payloadRoot = objectValue(payload.payload);
  const entity = objectValue(objectValue(payloadRoot['payment.downtime']).entity);
  const instrument = objectValue(entity.instrument);
  const eventType = String(payload.event ?? 'payment.downtime.updated');
  const issuer = String(instrument.issuer ?? instrument.psp ?? instrument.vpa_handle ?? 'Unknown');
  const rail = entity.method === 'upi' ? 'UPI AutoPay' : entity.method === 'card' ? 'Cards' : String(entity.method ?? 'eMandate');
  const resolved = eventType.endsWith('.resolved') || entity.status === 'resolved';
  const severity = String(entity.severity ?? 'medium');
  return {
    rawId: String(entity.id ?? `down_${now}`),
    railKey: `${issuer}:${rail}`,
    bank: issuer,
    rail,
    status: resolved ? 'healthy' as const : severity === 'low' ? 'degraded' as const : 'outage' as const,
    declineRate: resolved ? 0.02 : severity === 'high' ? 0.4 : 0.18,
    sourceEventId: String(entity.id ?? `down_${now}`),
    updatedAt: now,
  };
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('x-razorpay-signature') ?? '';
  const runtime = runtimeEnv();
  const fixture = runtime.ALLOW_FIXTURE_WEBHOOKS === '1' && request.headers.get('x-recovery-loop-fixture') === '1';
  const secret = runtime.RAZORPAY_WEBHOOK_SECRET;
  if (!secret && !fixture) return Response.json({ error: 'Webhook secret is not configured.' }, { status: 503 });
  const verified = fixture || timingSafeEqualHex(await hmacHex(body, secret ?? 'fixture'), signature);
  if (!verified) return Response.json({ error: 'Invalid webhook signature.' }, { status: 401 });
  let payload: JsonObject;
  try { payload = JSON.parse(body); } catch { return Response.json({ error: 'Invalid JSON.' }, { status: 400 }); }
  const now = Date.now();
  const eventType = String(payload.event ?? 'unknown');
  if (eventType.startsWith('payment.downtime.')) {
    const health = downtimeHealth(payload, now);
    if (runtime.DB) {
      await persistRawEvent(runtime.DB, { id: health.rawId, eventType, receivedAt: now, payload, signatureVerified: verified });
      await setRailHealth(runtime.DB, health);
    }
    return Response.json({ accepted: true, persisted: Boolean(runtime.DB), railHealth: health }, { status: 202 });
  }
  const event = toFailureEvent(payload, now);
  if (runtime.DB) {
    const currentHealth = await getRailHealth(runtime.DB, event.bank, event.rail);
    if (currentHealth?.status === 'outage') {
      event.outageActive = true;
      event.bankDeclineRate = Number(currentHealth.decline_rate ?? 0.35);
    }
  }
  const decision = decideRecovery(event, { monthlyBudget: 10000, remainingAttempts: 4200, maxAttempts: 3, coverageThreshold: 0.28, maxDeclineRate: 0.12 }, now);
  const audit = createAuditEntry(event, decision, now);
  if (runtime.DB) await persistRecoveryRecord(runtime.DB, { raw: { id: event.id, eventType: String(payload.event ?? 'unknown'), receivedAt: now, payload, signatureVerified: verified }, decision, audit });
  return Response.json({ accepted: true, persisted: Boolean(runtime.DB), eventId: event.id, decision }, { status: 202 });
}
