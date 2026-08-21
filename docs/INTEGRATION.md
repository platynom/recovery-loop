# Razorpay test-mode integration

## Inputs required from the project owner

- A Razorpay account switched to Test Mode.
- A test-mode key ID and key secret.
- A separately chosen webhook secret.
- A reachable HTTPS URL for the webhook endpoint.

Keep all three secrets in `.env.local`. Do not paste them into source files, issues, screenshots, or chat messages.

## Webhook endpoint

`POST /api/webhooks/razorpay`

The endpoint reads the untouched request body, verifies `x-razorpay-signature`, parses the event only after verification, persists the raw payload, updates rail health when relevant, computes a decision, and persists an audit entry.

Synthetic fixture replay requires both local `ALLOW_FIXTURE_WEBHOOKS=1` and the explicit `x-recovery-loop-fixture: 1` header. Never configure `ALLOW_FIXTURE_WEBHOOKS` on a public deployment.

## Recommended subscriptions

- `payment.failed`
- `payment.captured`
- `payment.downtime.started`
- `payment.downtime.updated`
- `payment.downtime.resolved`
- `subscription.charged`
- `subscription.pending`
- `subscription.halted`

Event availability can vary by account and enabled products; select only events visible in the test dashboard.

## Ground-truth capture checklist

- Capture at least 20 complete test-mode failure payloads.
- Preserve the raw JSON before cleaning or normalization.
- Record whether each code was directly observed or only documented.
- Capture successful follow-up events so recoveries can be labeled.
- Never invent an error code or call simulated data “observed.”
