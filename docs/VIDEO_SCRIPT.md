# Five-minute demo script

## 0:00–0:40 — Problem

Show a fixed retry ladder. Explain that attempts are scarce and a blind ladder can spend all of them during a bank outage.

## 0:40–1:20 — Insight

Show Razorpay payment failure events, payment downtime events, and subscription recovery states. Explain that Recovery Loop connects signals that are otherwise reviewed separately.

## 1:20–2:20 — Decision inspector

Open a payment. Walk through failure category, recovery probability, attempt price, expected value, bank decline rate, hard policy checks, scheduled time, and immutable reason list.

## 2:20–3:10 — Outage moment

Press “Simulate outage.” Show HDFC retries change to wait or refuse and the attempts-protected count update.

## 3:10–4:10 — Evidence

Run `npm run evaluate` and `npm run replay:outage`. Compare rupees per attempt and fixed-budget revenue. Show the risk–coverage trend, calibration, censoring experiment, and false refusals.

## 4:10–5:00 — Limitations and next proof

State that current labels are simulated. Explain that genuine test-mode events, merchant outcomes, and an account-specific attempt-cost model are required for external performance claims. End on the test-mode execution lock and full audit trail.
