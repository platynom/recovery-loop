# Genuine Razorpay test-failure automation

This workflow creates genuine Razorpay **test-mode** payment attempts. It never accepts or uses live keys.

## Security setup

Put these values in the ignored `.env.local` file:

```text
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
ENABLE_RAZORPAY_TEST_LAB=1
TEST_FAILURE_TARGET=20
```

Do not paste credentials into chat or commit `.env.local`.

## Workflow

1. Run `npm run test-lab:create -- 20`. This creates 20 standard Payment Links through the real Razorpay Test API and stores an ignored local manifest.
2. Open each generated URL and complete the test checkout as a failure. Codex can browser-drive this step after the links exist, subject to Razorpay’s test checkout controls.
3. Keep the Recovery Loop webhook reachable over HTTPS to collect the genuine `payment.failed` events. If no tunnel is configured, the next step still collects genuine failed payment entities from Razorpay’s API.
4. Run `npm run test-lab:collect -- <manifest-path>`. It fetches every payment belonging to the guarded run—failures and successes—and saves the complete API entity after recursive contact/email redaction under `data/raw_events/`.

For test cards that require Standard Checkout, create a five-order guarded run with `npm run test-lab:checkout:create`, start the local page with `npm run test-lab:checkout:serve -- <manifest-path>`, and run `npm run test-lab:checkout:assert -- <manifest-path> <sequence>` immediately before each submission. Every command aborts unless the configured key begins with `rzp_test_`; the assertion also verifies that the remote Order belongs to the same guarded run.
5. Review the collection summary. Only events returned by the Razorpay Test API count as observed; generated fixtures do not.

## Limits

Razorpay documents a maximum of 30 Payment Links per business in Test Mode. The script enforces that limit. More than 30 genuine failures should reuse existing test links or use a standard Checkout order flow rather than trying to create unlimited links.

Razorpay’s Payments API cannot itself collect or create a payment, so a genuine failure still requires the test Checkout flow. The automation separates API-safe setup and collection from the browser-driven failure step.
