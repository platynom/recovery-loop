# Submission checklist

Checked means verified in the current workspace on 23 August 2026. Unchecked items include the reason they are not done; none is an aspirational tick.

## Evidence and product — verified locally

- [x] Five-screen dashboard loads decision inspector, decision stream, per-mandate budget, simulated issuer health, and policy comparison.
- [x] Policy comparison shows both efficiency and total-revenue results for NPCI-calibrated UPI and simulated Cards.
- [x] Outage control is visibly labelled `Simulated outage scenario`; loading, empty, and fetch-error states are distinct.
- [x] Final five-seed artifact exists at `data/evaluation/fix7-npci-calibrated.json` and the dashboard reads it through the runtime API.
- [x] NPCI AutoPay, NACH, and UPI calibration inputs are stored under `data/npci/` with fetch dates and source URLs.
- [x] Fifteen Razorpay test-mode failures are committed in redacted form under `data/raw_events/`.
- [x] Capture-time code removes contact and email fields, and an automated test checks every committed event.
- [x] The observed taxonomy evidence records the tuple `business | payment_initiation | international_transaction_not_allowed`, not the generic `BAD_REQUEST_ERROR` code.
- [x] README leads with the final loss, reports both rails, labels every evidence mode, and documents all six evaluation corrections.
- [x] Architecture, evaluation protocol, corrected results, integration guide, and limitations documents exist.
- [x] Five-minute spoken script, mechanical shot list, and thirty-second cut-down exist in `docs/VIDEO_SCRIPT.md`.
- [x] Test-mode execution guard, signed webhook verification, canonical issuer join, and loud issuer-join failure logging are implemented and tested.
- [x] ESLint, 42 relevant tests, and the production build passed after the dashboard rebuild.
- [x] `.env.local` exists locally and is excluded by `.gitignore`; no credential value is tracked.

## Evidence gaps — not complete

- [ ] Capture at least 20 genuine test-mode failures — 15 are committed, so 5 more are needed to reach the target.
- [ ] Capture retryable failure diversity — all 15 observed events are the same permanent merchant-configuration rejection and do not exercise recovery logic.
- [ ] Capture issuer-bearing failures — all 15 have `bank: null` and `card.issuer: null`, so none can join to issuer health.
- [ ] Replace simulated repeat-attempt outcomes with real merchant outcomes — no public attempt-level Indian merchant dataset was found and no private merchant dataset has been supplied.
- [ ] Calibrate Cards to an Indian authorization-decline baseline — no suitable public baseline was found; NACH bulk-debit returns are not a valid proxy.
- [ ] Run a live A/B test — the project is intentionally locked to Razorpay test mode and has no production authorization.

## Recording and publication — not complete

- [ ] Verify a currently reachable webhook URL — the earlier Cloudflare quick tunnel was temporary and no persistent public endpoint is verified now.
- [ ] Record the five-minute video — the final script and shot order are ready, but no recording file exists in the repository.
- [ ] Review the recording against the final README numbers — blocked until the video is recorded.
- [ ] Commit the final engineering and narrative changes — the working tree still contains uncommitted dashboard, evaluation, documentation, and test changes.
- [ ] Choose a public GitHub repository destination — no Git remote is configured, and publication was explicitly deferred.
- [ ] Publish the repository — blocked on destination approval and the final commit.
- [ ] Deploy a stable public demo — hosting configuration exists, but no stable deployment URL has been verified.
- [ ] Confirm the official submission deadline — it has not been verified from the official application form.
- [ ] Submit the project — the form has not been completed and no submission receipt exists.

## Final pre-submission safety check — not yet run

- [ ] Scan the final commit for secrets and personal data — this must run after the final commit, not against a changing worktree.
- [ ] Clone the public repository into a clean directory and run install, tests, evaluation, and build — impossible until the repository is published.
- [ ] Verify every link and source from the public README — local links are present, but public rendering cannot be checked before publication.
- [ ] Confirm the video shows `Simulated`, `NPCI-calibrated`, and `Observed` labels accurately — blocked until recording.

Never publish `.env.local`, Razorpay keys, the webhook secret, unredacted payloads, or live-mode credentials.
