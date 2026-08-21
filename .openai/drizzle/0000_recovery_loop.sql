CREATE TABLE IF NOT EXISTS raw_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  received_at INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  signature_verified INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('retry','wait','refuse')),
  scheduled_at INTEGER,
  probability REAL NOT NULL,
  attempt_price REAL NOT NULL,
  expected_value REAL NOT NULL,
  reasons_json TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (event_id) REFERENCES raw_events(id)
);
CREATE TABLE IF NOT EXISTS audit_entries (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  inputs_json TEXT NOT NULL,
  output_json TEXT NOT NULL,
  reasons_json TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES raw_events(id),
  FOREIGN KEY (decision_id) REFERENCES decisions(id)
);
CREATE TABLE IF NOT EXISTS rail_health (
  rail_key TEXT PRIMARY KEY,
  bank TEXT NOT NULL,
  rail TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy','degraded','outage')),
  decline_rate REAL NOT NULL,
  source_event_id TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_action_created ON decisions(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event_id ON audit_entries(event_id);
CREATE INDEX IF NOT EXISTS idx_rail_health_status ON rail_health(status, updated_at DESC);
PRAGMA optimize;
