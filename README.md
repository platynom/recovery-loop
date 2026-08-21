# Recovery Loop

Recovery Loop is a refusal-aware payment recovery operations product. It decides when a failed subscription payment is worth retrying, when to wait, and when an outage or issuer signal means an attempt should not be spent.

## Product thesis

Most retry systems optimize for recovery rate. Recovery Loop optimizes **rupees recovered per attempt**, giving finance and payments teams a measurable view of both recovered revenue and avoided retry waste.

The current application is an interactive product demo with:

- revenue recovery and attempt-budget KPIs;
- an outage simulator that changes pending decisions;
- a live, inspectable decision stream;
- bank-health and payment-rail monitoring;
- fixed-ladder baseline comparison; and
- a commercial value model for a mid-market subscription merchant.

All displayed outcomes are labeled demo data. No live Razorpay keys or payment data are used.

## Run locally

```bash
npm install
npm run dev
```

## Next product slice

Connect Razorpay test-mode webhooks, persist an immutable decision audit log, and replace the demo stream with replayable failure events. See `docs/ARCHITECTURE.md` and `docs/PROJECT_LOG.md`.
