# Recovery Loop

**Signal-aware retry scheduling for Indian payment rails.**

Recovery Loop is a refusal-aware payment recovery system for subscription businesses. It diagnoses failed payments, estimates recovery probability across candidate time windows, prices each scarce retry attempt, and either retries, waits, or refuses with a complete audit record.

The product’s primary metric is **rupees recovered per attempt spent**, not recovery rate in isolation.

## Why it exists

Fixed T+1/T+2/T+3 ladders can spend attempts during bank or payment-rail outages. Recovery Loop connects failure diagnosis, Razorpay downtime signals, attempt budgets, and recovery-value estimation in one defensible policy.

## What is implemented

- Razorpay-compatible webhook endpoint with raw-body HMAC-SHA256 verification.
- Handlers for `payment.failed` and `payment.downtime.started|updated|resolved`.
- Durable D1 schema for untouched events, decisions, bank health, and immutable audit records.
- Failure taxonomy that clearly separates documented codes from observed codes.
- Deterministic recovery model with salary-window, bank-health, rail, attempt-number, and failure-category features.
- Hard refusal gate for issuer stop signals, outages, exhausted budgets, non-retryable categories, abnormal decline rates, and low coverage.
- Attempt pricing and expected-value scheduler across 2h, 4h, 8h, 24h, 48h, and 72h candidates.
- Test-mode-only execution adapter with idempotency keys.
- Seeded payment simulator and outage replay.
- Evaluation against do-nothing, fixed ladder, payday heuristic, and plain-threshold baselines.
- Fixed-budget revenue, rupees/attempt, outage waste, risk–coverage, calibration, censoring, and false-refusal reports.
- Interactive dashboard with decision inspector, live stream, attempt budget, bank health, baseline comparison, and outage button.
- Automated policy and safety tests.
- Guarded LLM adapters for unknown-text normalization and fact-bound decision explanations; neither can choose an action.

## Safety boundary

Recovery Loop is locked to **Razorpay test mode**. The executor throws if asked to run in live mode. No live keys, real customer information, or card data belong in this repository.

The LLM is not the decision-maker. It may later normalize issuer text or verbalize already-computed reasons; deterministic policy code owns retry, wait, and refusal actions.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful commands:

```bash
npm test
npm run evaluate
npm run replay:outage
npm run replay:fixtures
npm run test-lab:create -- 20
npm run test-lab:collect
npm run build
```

## Connect a Razorpay test account

1. Copy `.env.example` to `.env.local` and enter **test-mode** values only.
2. In the Razorpay test dashboard, configure the webhook URL as `/api/webhooks/razorpay` on your reachable local tunnel or deployed private URL.
3. Subscribe to `payment.failed`, `payment.captured`, `subscription.charged`, `subscription.pending`, `subscription.halted`, and the available `payment.downtime.*` events.
4. Use test cards or `failure@razorpay` to create failures.
5. Save untouched event JSON into `data/raw_events/`, one file per event, after removing any personal test details.
6. Move a taxonomy code from documented to observed only after it appears in a captured test event.

Official references:

- [Razorpay webhooks](https://razorpay.com/docs/webhooks/)
- [Payment and downtime webhook events](https://razorpay.com/docs/webhooks/payments/?preferred-country=IN)
- [Subscription webhook events](https://razorpay.com/docs/webhooks/subscriptions/)
- [Test and live modes](https://razorpay.com/docs/payments/dashboard/test-live-modes/?preferred-country=IN)
- [Indian test cards](https://razorpay.com/docs/payments/payments/test-card-details/?preferred-country=IN)
- [Payment downtime API](https://razorpay.com/docs/api/payments/downtime/?preferred-country=IN)

## Evidence status

The committed dashboard and evaluation currently use deterministic, labeled simulation data. They demonstrate system behavior but are not production performance claims. Genuine test-mode results cannot be created without a Razorpay test account and captured webhooks.

See:

- `docs/ARCHITECTURE.md`
- `docs/EVALUATION.md`
- `docs/EVALUATION_RESULTS.md`
- `docs/INTEGRATION.md`
- `docs/LIMITATIONS.md`
- `docs/PROJECT_LOG.md`
- `docs/VIDEO_SCRIPT.md`
- `docs/TEST_FAILURE_AUTOMATION.md`
- `docs/BUSINESS_MODEL.md`
- `docs/SUBMISSION_CHECKLIST.md`

## Repository layout

```text
app/                 dashboard and API routes
data/                taxonomy, synthetic fixtures, raw-event drop zone
db/                  D1 schema and persistence helper
docs/                architecture, evidence, limitations, pitch material
eval/                baselines and evaluation harness
sim/                 deterministic event generator and outage replay
src/diagnose/        failure categorization
src/predict/         recovery probability model
src/gate/            refusal policy
src/policy/          pricing and scheduling
src/execute/         test-mode-only execution boundary
src/audit/           complete decision audit records
tests/               policy and safety tests
```
