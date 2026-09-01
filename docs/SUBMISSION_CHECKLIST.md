# Submission checklist

Checked means verified in the current workspace on 1 September 2026. Unchecked items include the reason they are not done; none is an aspirational tick.

## Evidence and product — verified locally

- [x] Five-screen dashboard loads decision inspector, decision stream, per-mandate budget, simulated issuer health, and policy comparison.
- [x] Policy comparison shows both efficiency and total-revenue results for NPCI-calibrated UPI and simulated Cards.
- [x] Outage control is visibly labelled `Simulated outage scenario`; loading, empty, and fetch-error states are distinct.
- [x] Final five-seed artifact exists at `data/evaluation/fix7-npci-calibrated.json` and the dashboard reads it through the runtime API.
- [x] NPCI AutoPay, NACH, and UPI calibration inputs are stored under `data/npci/` with fetch dates and source URLs.
- [x] Twenty Razorpay test-mode payment entities are committed in redacted form under `data/raw_events/`: 16 failed, 3 captured, and 1 created.
- [x] Capture-time code removes contact and email fields, and an automated test checks every committed event.
- [x] The observed taxonomy evidence records the tuple `business | payment_initiation | international_transaction_not_allowed`, not the generic `BAD_REQUEST_ERROR` code.
- [x] README leads with the final loss, reports both rails, labels every evidence mode, and documents all six evaluation corrections.
- [x] Architecture, evaluation protocol, corrected results, integration guide, and limitations documents exist.
- [x] Five-minute spoken script, mechanical shot list, and thirty-second cut-down exist in `docs/VIDEO_SCRIPT.md`.
- [x] Test-mode execution guard, signed webhook verification, canonical issuer join, and loud issuer-join failure logging are implemented and tested.
- [x] ESLint, 44 relevant tests, and the production build passed after the issuer-bearing capture update.
- [x] `.env.local` exists locally and is excluded by `.gitignore`; no credential value is tracked.

## Evidence gaps — not complete

- [ ] Capture at least 20 genuine test-mode failures — five additional genuine attempts produced only one failure, bringing the failure count to 16; three documented failure cards captured successfully and one remains `created`.
- [ ] Capture retryable failure diversity — the new `gateway | payment_authorization | payment_failed` tuple is observed once, but it is generic and does not establish a repeat-attempt outcome.
- [x] Capture an issuer-bearing failure — the domestic-card failure carries `card.issuer: DCBL`, which joins a matching `payment.downtime.instrument.issuer` after canonicalization.
- [ ] Capture complete webhook envelopes for the five new attempts — the configured temporary tunnel had expired and no safe reachable receiver or dashboard delivery body was available; only complete redacted Test Payments API entities are committed.
- [ ] Replace simulated repeat-attempt outcomes with real merchant outcomes — no public attempt-level Indian merchant dataset was found and no private merchant dataset has been supplied.
- [ ] Calibrate Cards to an Indian authorization-decline baseline — no suitable public baseline was found; NACH bulk-debit returns are not a valid proxy.
- [ ] Run a live A/B test — the project is intentionally locked to Razorpay test mode and has no production authorization.

## Recording and publication — not complete

- [ ] Verify a currently reachable webhook URL — the earlier Cloudflare quick tunnel was temporary and no persistent public endpoint is verified now.
- [ ] Record the five-minute video — the final script and shot order are ready, but no recording file exists in the repository.
- [ ] Review the recording against the final README numbers — blocked until the video is recorded.
- [x] Commit the final engineering and narrative changes — the policy, evidence, dashboard, recording assets, narrative, and tests are in Git history.
- [x] Choose a public GitHub repository destination — [`platynom/recovery-loop`](https://github.com/platynom/recovery-loop) is the approved destination.
- [x] Publish the repository — the complete history is public and the local branch tracks `origin/master`.
- [ ] Deploy a stable public demo — hosting configuration exists, but no stable deployment URL has been verified.
- [ ] Confirm the official submission deadline — it has not been verified from the official application form.
- [ ] Submit the project — the form has not been completed and no submission receipt exists.

## Final pre-submission safety check — not yet run

- [x] Scan the final reachable history for secrets and personal data — 18 commits were scanned before publication; no Razorpay keys, secret assignments, private keys, personal emails, or JSON contact/email fields were found.
- [ ] Clone the public repository into a clean directory and run install, tests, evaluation, and build — the earlier clean-clone proof used the local repository; repeat it from the public URL before submission.
- [ ] Verify every link and source from the public README — GitHub rendering and all required repository artifacts are verified; a complete external-link sweep remains.
- [ ] Confirm the video shows `Simulated`, `NPCI-calibrated`, and `Observed` labels accurately — blocked until recording.

Never publish `.env.local`, Razorpay keys, the webhook secret, unredacted payloads, or live-mode credentials.
