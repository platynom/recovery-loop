import { env } from 'cloudflare:workers';
import { schemaStatements } from './schema';

type RuntimeEnv = Cloudflare.Env & { DB?: D1Database; RAZORPAY_WEBHOOK_SECRET?: string; ALLOW_FIXTURE_WEBHOOKS?: string };

export function runtimeEnv() { return env as RuntimeEnv; }

export async function initializeDatabase(db: D1Database) {
  await db.batch(schemaStatements.map((statement) => db.prepare(statement)));
  await db.prepare('PRAGMA optimize').run();
}

export async function persistRecoveryRecord(db: D1Database, record: {
  raw: { id: string; eventType: string; receivedAt: number; payload: unknown; signatureVerified: boolean };
  decision: { id: string; eventId: string; action: string; scheduledAt: number | null; probability: number; attemptPrice: number; expectedValue: number; reasons: string[]; policyVersion: string };
  audit: { id: string; eventId: string; decisionId: string; createdAt: number; inputs: unknown; output: unknown; reasons: string[]; policyVersion: string };
}) {
  await initializeDatabase(db);
  await db.batch([
    db.prepare(`INSERT OR IGNORE INTO raw_events (id,event_type,received_at,payload_json,signature_verified) VALUES (?,?,?,?,?)`).bind(record.raw.id, record.raw.eventType, record.raw.receivedAt, JSON.stringify(record.raw.payload), record.raw.signatureVerified ? 1 : 0),
    db.prepare(`INSERT OR REPLACE INTO decisions (id,event_id,action,scheduled_at,probability,attempt_price,expected_value,reasons_json,policy_version,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(record.decision.id, record.decision.eventId, record.decision.action, record.decision.scheduledAt, record.decision.probability, record.decision.attemptPrice, record.decision.expectedValue, JSON.stringify(record.decision.reasons), record.decision.policyVersion, record.audit.createdAt),
    db.prepare(`INSERT OR REPLACE INTO audit_entries (id,event_id,decision_id,created_at,inputs_json,output_json,reasons_json,policy_version) VALUES (?,?,?,?,?,?,?,?)`).bind(record.audit.id, record.audit.eventId, record.audit.decisionId, record.audit.createdAt, JSON.stringify(record.audit.inputs), JSON.stringify(record.audit.output), JSON.stringify(record.audit.reasons), record.audit.policyVersion),
  ]);
}

export async function listDecisions(db: D1Database, limit = 50) {
  await initializeDatabase(db);
  const result = await db.prepare(`SELECT d.*, r.event_type, r.payload_json FROM decisions d JOIN raw_events r ON r.id=d.event_id ORDER BY d.created_at DESC LIMIT ?`).bind(Math.min(200, Math.max(1, limit))).all();
  return result.results;
}

export async function persistRawEvent(db: D1Database, raw: { id: string; eventType: string; receivedAt: number; payload: unknown; signatureVerified: boolean }) {
  await initializeDatabase(db);
  await db.prepare(`INSERT OR IGNORE INTO raw_events (id,event_type,received_at,payload_json,signature_verified) VALUES (?,?,?,?,?)`).bind(raw.id, raw.eventType, raw.receivedAt, JSON.stringify(raw.payload), raw.signatureVerified ? 1 : 0).run();
}

export async function setRailHealth(db: D1Database, health: { railKey: string; bank: string; rail: string; status: 'healthy'|'degraded'|'outage'; declineRate: number; sourceEventId: string; updatedAt: number }) {
  await initializeDatabase(db);
  await db.prepare(`INSERT OR REPLACE INTO rail_health (rail_key,bank,rail,status,decline_rate,source_event_id,updated_at) VALUES (?,?,?,?,?,?,?)`).bind(health.railKey, health.bank, health.rail, health.status, health.declineRate, health.sourceEventId, health.updatedAt).run();
}

export async function getRailHealth(db: D1Database, bank: string, rail: string) {
  await initializeDatabase(db);
  return db.prepare(`SELECT * FROM rail_health WHERE bank=? AND rail=? ORDER BY updated_at DESC LIMIT 1`).bind(bank, rail).first<Record<string, unknown>>();
}
