# Captured Razorpay test events

This directory contains **15 redacted payment records** captured on **22 August 2026** from Razorpay's **Test Payments API** (`GET /v1/payments`). They are API responses collected by `scripts/collect-test-failures.mjs`, not production payments and not synthetic fixtures.

All 15 records contain the same observed failure tuple:

- `error_code`: `BAD_REQUEST_ERROR`
- `error_source`: `business`
- `error_step`: `payment_initiation`
- `error_reason`: `international_transaction_not_allowed`

This is a permanent merchant-configuration rejection: the test business accepts domestic Indian cards only, while these test attempts were international. Consequently, all 15 events validate ingestion, tuple diagnosis, terminal refusal, and audit behavior, but **do not exercise retry scheduling, economic waits, outage deferral, or recovery**.

The capture path recursively removes `email`, `contact`, `customer_email`, and `customer_contact` before writing a file. Existing captures were passed through the same code. Never commit API keys, webhook secrets, unredacted customer information, or live-mode data.

Issuer-health limitation: every captured record has `bank: null` and `card.issuer: null`, so none can join to an issuer downtime record. A better capture must include a non-null issuer identifier that matches the downtime webhook's `instrument.issuer` after canonicalization.

Files under `data/fixtures/` remain synthetic integration fixtures and must not be counted among these 15 observed failures.
