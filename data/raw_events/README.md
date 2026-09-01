# Captured Razorpay test events

This directory contains **20 redacted Razorpay test API payment entities** captured from `GET /v1/payments`: 15 on **22 August 2026** and five on **1 September 2026**. They are test-mode API responses collected by `scripts/collect-test-failures.mjs`, not production payments or synthetic fixtures.

## Outcome and tuple inventory

| Count | Status | Observed tuple (`source | step | reason | code`) |
|---:|---|---|
| 15 | failed | `business | payment_initiation | international_transaction_not_allowed | BAD_REQUEST_ERROR` |
| 1 | failed | `gateway | payment_authorization | payment_failed | BAD_REQUEST_ERROR` |
| 3 | captured | no error tuple |
| 1 | created | no error tuple |

The first 15 are one permanent merchant-configuration rejection caused by international-card attempts against a domestic-only test account. They validate ingestion, tuple diagnosis, terminal refusal, and audit behavior, but do not exercise retry recovery.

The five later attempts used Razorpay Standard Checkout and domestic Visa test cards. Razorpay returned `card.issuer: "DCBL"` on all five, including the failed `card_declined` attempt. This identifier canonicalizes to `DCBL` and can join a `payment.downtime` payload whose `instrument.issuer` is `DCBL`. The intended UPI `failure@razorpay` path could not be exercised because the account's Checkout exposed UPI QR/Intent rather than a VPA-entry field; that attempt was completed with a domestic card and is recorded as a card payment. Three documented failure-scenario cards were captured successfully and one remained `created`, so this set contains **16 genuine failures, not 20**.

## Field coverage

| Capture group | `bank` | `card.issuer` | `vpa` | error tuple |
|---|---|---|---|---|
| 15 international-card failures | null | null | null | populated; identical permanent tuple |
| 5 domestic-card attempts | null | `DCBL` | null | populated on 1 failed payment; null on 3 captured and 1 created payment |

Each file is the complete payment entity returned by the Test Payments API after recursive removal of `email`, `contact`, `customer_email`, and `customer_contact`. Redaction happens before disk write in `scripts/collect-test-failures.mjs`; the same redactor is used by the signed webhook route for future test-lab deliveries.

No webhook delivery envelope was captured for these five attempts. Razorpay was still configured with an expired temporary tunnel, and no safe reachable receiver or dashboard delivery body was available during capture. The repository therefore does not pretend that an API entity is a webhook payload.

Files under `data/fixtures/` remain synthetic integration fixtures and are not counted as observed evidence.
