# Evaluation protocol

## Fix 7 corrected NPCI data grounding — frozen before rerun

The correction fixes three modelling bugs without selecting any value from policy results. It changes no coverage threshold, candidate time, probability rule, cost, seed, or rail cap.

- Raw rendered HTML tables are retained in `data/npci/` with fetch date `2026-08-22`. The common window is January 2025–June 2026 across HDFC, SBI, ICICI, and Axis.
- UPI failed cohorts sample month/bank using payer-PSP volume × observed `(BD + TD)`. Failure class uses observed TD versus BD; NACH financial versus non-financial returns supply the declared soft-versus-hard split.
- Cards are excluded from NPCI calibration. No suitable public India card-authorization decline baseline was found; the Cards result is explicitly uncalibrated.
- Each bank baseline is its volume-weighted mean AutoPay decline rate over the window. The NPCI gate threshold is 7.917882× baseline, frozen before policy evaluation as the smallest visible bank-normalized TD elevation in a reportable-incident month. The legacy simulator uses 4×, preserving the original 12%/3% intent.
- Published NACH T+0…T+4 shares impose a response-availability floor for the calibrated UPI proxy. Published UPI incident counts/downtime determine reportable-outage overlap and mean duration; exact placement is assumed because timestamps are unavailable.
- Months are sampled uniformly. Amount, salary date, repeat-attempt probability/outcome, hard-decline subtypes, card MAC, costs, penalty, and policy remain frozen assumptions.
- The penalty uses only a policy's retry attempts and failed retries; original cohort failures are excluded and a zero-attempt policy incurs zero penalty.
- Decision control flow has three explicit outcomes: `refuse_terminal` for hard stops/cap/horizon, `wait` for economic or gate deferral, and `retry`. Waits consume no attempt, re-evaluate fresh state, retain UPI peak snapping and mandate caps, and use the unchanged three-day total deferral bound with the unchanged plain-rule decision at the cap.
- Five seeds × 2,000 mandates run as NPCI-calibrated UPI and uncalibrated Cards under per-mandate caps. Evidence is emitted to `data/evaluation/fix7-npci-calibrated.json`.

## Fix 6 mandate-local accounting — frozen before evaluation

Fix 6 corrects a constraint-category error without changing any policy threshold, probability, candidate window, retry cost, outcome rule, seed, or failure mix.

- The Fix 5 curve remains a **pooled portfolio-budget scenario**. Its attempts are transferable across mandates and it is not used to locate UPI AutoPay or card operation.
- Per-mandate mode has no shared attempt pool. Each UPI AutoPay and card mandate independently begins with three retry tokens after its original failure; tokens cannot move between mandates.
- Recovery Loop replaces the pooled scarcity surcharge only in per-mandate mode. For every candidate slot it computes a finite-horizon Bellman table over `(attempts_remaining, days_remaining)` using observable model probabilities only. At each state, `V = max(wait, attempt)`, where `attempt = p × amount − network_cost + (1 − p) × V(next_day, attempts_remaining − 1)`. The opportunity-cost surcharge is `max(0, V(next_day, attempts_remaining) − (1 − p) × V(next_day, attempts_remaining − 1))`.
- The table uses at most three remaining attempts and the days left in the frozen 30-day horizon. No hidden outcome state enters pricing. A representative exact table for each rail is emitted with the results.
- An unused stranded attempt is a retry token remaining at horizon on an unresolved mandate. Retry capacity left after a successful recovery is reported separately and is not called stranded.
- The same five seeds and 2,000-event single-rail cohorts are evaluated for UPI AutoPay and cards. Fixed T+1/T+2/T+3 and Recovery Loop receive identical events and independent mandate-local caps.
- Machine-readable Fix 6 evidence is emitted to `data/evaluation/fix6-per-mandate.json` and exposed through `/api/evaluation`.

## Fix 5 measurement extension — frozen before evaluation

Fix 5 changes no policy parameter, seed, cost, penalty, rail rule, lifecycle cap, outcome rule, or failure mix. It only closes the previously unmeasured budget range and emits the resulting evidence.

- The existing scarcity points remain `50, 100, …, 2,000`. The extension is `2,100, 2,200, …, 4,000`, using the same five seeds, 2,000 failures per seed, HDFC outage, and 30-day horizon.
- The reported upper crossover is the first tested budget at or above 2,000 whose five-seed mean paired net advantage (`Recovery Loop − fixed ladder`) is zero or negative. The immediately preceding tested point is also reported. Because outcomes are discrete, this is a grid crossover rather than an interpolated claim.
- Every point reports all five paired differences plus mean, minimum, and maximum. Sign changes anywhere in the full curve are reported; no monotonicity is assumed.
- Net revenue is reported both with and without the ₹415,000 decline-rate penalty. The no-penalty value removes only that penalty and retains retry and stop-signal costs.
- A 2,000-mandate, single-rail UPI cohort and a 2,000-mandate, single-rail card cohort each have a theoretical ceiling of 6,000 retries (`2,000 × 3`). Each rail is evaluated directly at that operating budget with the same seeds and frozen model.
- Machine-readable Fix 5 evidence is emitted to `data/evaluation/fix5-scarcity-curve.json` for the dashboard/API.

## Fix 4 pre-registration — frozen before evaluation

The following parameters are fixed before running Fix 4. They will not be adjusted after seeing results, and Recovery Loop will be reported as losing if the measured net result is negative.

### Attempt lifecycles

- **UPI AutoPay:** one original attempt plus at most three retries per mandate sequence (four total attempts). NPCI Circular `UPI OC No. 215A FY 2025-26` specifies a maximum of one attempt and three retries and requires AutoPay execution in non-peak hours. [NPCI circular PDF](https://www.npci.org.in/PDF/npci/upi/circular/2025/UPI-OC-No-215-A-FY-2025-26-Guidelines-on-usage-of-UPI-APIs.pdf)
- **Cards:** one original attempt plus at most three retries (four total attempts), followed by a simulated `halted` transition. Razorpay documents that subscriptions move to `pending`, are retried, and become `halted` after all retries; its halted webhook example exposes `auth_attempts: 4`. [Razorpay payment retries](https://razorpay.com/docs/payments/subscriptions/payment-retries/), [Razorpay subscription webhooks](https://razorpay.com/docs/webhooks/subscriptions/)
- **eMandate:** one original attempt plus two retries (three total attempts). This is a conservative simulation assumption because the cited sources do not provide a universal eMandate cap.
- Every policy receives the same generated mandates and rail caps. A successful attempt closes the lifecycle. An unsuccessful permitted attempt increments the mandate's consumed-attempt count. The mandate is exhausted for the 30-day horizon when its rail cap is reached.

### Scheduling constraints

- UPI AutoPay attempts are barred during `10:00–13:00` and `17:00–21:30` IST. A prohibited candidate is moved to the first legal instant after the window. The NPCI circular requires non-peak execution; the exact peak windows are reproduced in the BSE Clearing notice distributing the NPCI direction. [NPCI circular](https://www.npci.org.in/PDF/npci/upi/circular/2025/UPI-OC-No-215-A-FY-2025-26-Guidelines-on-usage-of-UPI-APIs.pdf), [BSE Clearing notice](https://noticeblue.com/circulars/da33580c-5800-4958-b819-515cee5e80e3)
- Mastercard Merchant Advice Codes `03` and `21` are hard stops. Codes `24–30` impose minimum waits of 1 hour, 24 hours, 2 days, 4 days, 6 days, 8 days, and 10 days. The values are documented-secondary because a current public Mastercard-owned MAC table was not located; the implementation follows Braintree's processor reference and Visa Acceptance's association-code reference. [Braintree MAC table](https://developer.paypal.com/braintree/docs/reference/general/merchant-responses/merchant-advice-codes), [Visa Acceptance MAC reference](https://support.visaacceptance.com/knowledgebase/knowledgearticle/?code=000003859)
- Synthetic card events use a frozen deterministic MAC mapping: technical→`24`, insufficient funds→`25`, issuer decline→`26`, customer action and permanent configuration→`03`, and inactive mandate→`21`. This mapping is a transparent coverage assumption, not a claim about observed MAC prevalence.
- The fixed ladder is implemented as retries at T+1, T+2, and T+3 days, subject to the same rail caps, UPI windows, MAC floors, and hard stops as every other policy.

### Cost model

- Retry network cost: ₹1 for the first retry against a mandate and ₹2 for each later retry. These are frozen scenario costs inspired by card-network excessive-reattempt pricing, not quoted current Mastercard India fees. Mastercard publicly warns that its rules change; Braintree documents a USD 0.10 excessive-reattempt fee for some MAC misuse rather than the exact rupee values used here. [Mastercard merchant rules](https://www.mastercard.us/en-us/business/overview/support/rules.html), [Braintree decline guidance](https://developer.paypal.com/braintree/articles/control-panel/transactions/declines)
- Ignoring a stop signal costs an additional ₹0.10 per violating attempt. Compliant policies should make zero such attempts.
- Merchant decline-rate penalty: if final run-wide failed authorizations divided by total authorizations is greater than 15%, subtract ₹415,000 once from net revenue. The calculation includes each mandate's original failed authorization plus all policy retries. ₹415,000 is the frozen low-end scenario value (`USD 5,000 × ₹83/USD`) supplied for this evaluation; it is not presented as a current Visa fine schedule.
- The official 2025 Visa VAMP fact sheet instead monitors fraud/dispute and enumeration ratios, with region-specific count thresholds, and says India requirements were to be announced separately. Therefore the 15% decline trigger is explicitly a stress-test assumption rather than a Visa compliance claim. [Visa VAMP fact sheet](https://corporate.visa.com/content/dam/VCOM/corporate/visa-perspectives/security-and-trust/documents/visa-acquirer-monitoring-program-fact-sheet-2025.pdf)
- **Gross revenue** is the sum of recovered payment amounts. **Net revenue** is gross revenue minus retry network costs, stop-signal penalties, and the one-time decline-rate penalty when triggered. Both are reported.

### Frozen evaluation run

- Seeds: `20260818`, `20260819`, `20260820`, `20260821`, `20260822`.
- 2,000 generated mandates per seed; 30-day horizon; HDFC outage scenario.
- Headline comparisons include gross and net revenue, gross and net rupees per attempt, final merchant decline rate, penalty activation, illegal UPI peak attempts prevented, mandates exhausted, and recoveries still available at exhaustion.
- No parameter, threshold, failure mix, cost, outcome rule, or seed may be changed after the first Fix 4 result is observed.
- If Recovery Loop loses on total net revenue, attempt scarcity is evaluated on a pre-registered grid of 50, 100, …, 2,000 run-wide retries per seed. The reported crossover is the largest grid budget where Recovery Loop's five-seed mean net revenue exceeds the fixed daily ladder's mean net revenue. Resolution is therefore 50 attempts; if no crossover exists, that is reported.

## Headline metric

Net rupees recovered per attempt spent, with gross rupees per attempt retained alongside it.

## Required comparisons

- Do nothing
- Razorpay-style fixed T+1/T+2/T+3 ladder
- Payday heuristic
- Plain bank-health threshold
- Recovery Loop

Every active policy is also evaluated at the same fixed attempt budget.

## Generated evidence

`npm run evaluate` deterministically generates 2,000 mandate lifecycles per seed and reports:

- retry attempts, recoveries, gross revenue, and net revenue;
- gross and net rupees recovered per attempt;
- decline rate, penalty activation, and retry costs;
- rail-cap exhaustion and counterfactual recoveries still available at the cap;
- prohibited UPI-window candidates moved to legal times;
- results over all five frozen seeds and the pre-registered attempt-scarcity grid;
- separate pooled-budget and non-transferable per-mandate evidence;
- exact mandate-local Bellman opportunity-cost tables and unused-token counts;
- risk–coverage curve across six thresholds;
- ten-bin predicted-versus-observed calibration;
- outage censoring population and counterfactual recoverability; and
- up to ten false refusals for manual inspection.

`npm run replay:outage` replays the same seeded population with and without an HDFC outage and reports the number of attempts protected.

## Interpretation boundary

These measurements prove that the code and safety rules behave as designed. They do not prove a real merchant uplift. Replace the generator’s labels with test-mode or historical merchant outcomes before presenting a performance claim externally.
