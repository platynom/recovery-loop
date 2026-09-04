# Recovery Loop

**Live demo:** https://recovery-loop-mu.vercel.app

**When is it worth retrying a failed payment — and when is refusing better?**

Razorpay retries failed subscription charges on a fixed calendar: T+1, T+2, T+3, then the subscription halts. It consumes no signal. Meanwhile Razorpay publishes a live issuer-downtime feed and runs an ML router that reacts to a degrading gateway within twenty minutes — and neither is wired to the retry scheduler. [Razorpay documents three retries before `halted`, a payment-downtime API, twenty-minute Optimizer downtimes, and that Optimizer rules do not apply to subsequent recurring debits.](https://razorpay.com/docs/payments/subscriptions/notifications/) ([downtime](https://razorpay.com/docs/api/payments/downtime/?preferred-country=IN), [routing](https://razorpay.com/docs/payments/optimizer/dynamic-routing/?preferred-country=IN), [recurring exclusion](https://razorpay.com/docs/payments/optimizer/recurring-payments/?preferred-country=IN))

I built a selective retry agent that refuses to spend an attempt when the issuer is down or the state is unfamiliar, and measured it against that ladder.

**A five-seed selection set chose a 14-day deferral cap; frozen-cap validation then produced a +₹1,068,274 mean paired UPI result and was positive in all 10 held-out seeds.** `[NPCI-calibrated inputs; Simulated outcomes]` This is not a one-point effect: UPI is positive in 10/10 validation seeds at every tested cap from 14 days through the 30-day horizon, and negative at 3 and 7 days. [Held-out evidence](data/evaluation/heldout-cap-validation.json)

The corrected finding is: **selective retry pays in the authored UPI world when deferral can span the simulated salary cycle; the first three-day design manufactured most of the reported stranding.** Cards is inconclusive at the frozen cap: +₹20,767 mean paired net, only 6/10 positive seeds, and a −₹76,374 to +₹135,507 range. The rest of this README explains how the cap was selected without using the held-out result.

## Results

The cap was selected on seeds `20260901`–`20260905`, frozen at 14 days, and evaluated once on held-out seeds `20260906`–`20260915`. Each seed contains 2,000 already-failed mandates per rail and a 30-day horizon. `[Simulated outcomes; NPCI-calibrated UPI inputs]` [Protocol](docs/EVALUATION.md) · [held-out artifact](data/evaluation/heldout-cap-validation.json)

| Rail and policy | Attempts | Recoveries | Gross revenue | Net revenue | Net ₹ / attempt | Stranded attempts |
|---|---:|---:|---:|---:|---:|---:|
| UPI fixed ladder | 5,406.3 | 838.5 | ₹2,212,896.20 | ₹1,789,083.60 | ₹330.94 | 0 |
| UPI Recovery Loop | 4,491.4 | 1,230.4 | ₹3,279,340.63 | ₹2,857,357.83 | ₹636.30 | 57.8 |
| Cards fixed ladder | 3,527.4 | 1,065.2 | ₹2,820,726.26 | ₹2,400,311.07 | ₹680.71 | 1,081.2 |
| Cards Recovery Loop | 2,674.1 | 1,071.4 | ₹2,840,020.74 | ₹2,421,077.94 | ₹905.73 | 1,783.8 |

UPI's paired mean is **+₹1,068,274.23**, range +₹850,537.93 to +₹1,205,356.57, positive in **10/10** validation seeds. Cards is **inconclusive**: +₹20,766.87, range −₹76,373.97 to +₹135,507.33, positive in **6/10** seeds. `[Held-out validation]`

| Validation cap | UPI paired net / positive seeds | Cards paired net / positive seeds |
|---:|---:|---:|
| 3 days | −₹768,571 / 0/10 | −₹714,206 / 0/10 |
| 7 days | −₹1,390,165 / 0/10 | −₹1,003,758 / 0/10 |
| 14 days — frozen | +₹1,068,274 / 10/10 | +₹20,767 / 6/10, inconclusive |
| 21 days | +₹338,368 / 10/10 | −₹298,174 / 0/10 |
| 28 days | +₹440,731 / 10/10 | −₹292,145 / 0/10 |
| 30-day horizon | +₹440,731 / 10/10 | −₹292,145 / 0/10 |
| 35 days | +₹440,731 / 10/10 | −₹292,145 / 0/10 |

UPI is positive across the broad 14–35-day range, not only at the selected point. Cards has one small, unstable positive mean at 14 days and negative means everywhere else; it is not described as a win.

### Superseded in-sample reference

The following five-seed, three-day table is retained for correction history. It is not the headline result.

| Rail and policy | Evidence label | Retry attempts | Recoveries | Gross revenue | Net revenue | Net ₹ / attempt | Stranded attempts |
|---|---|---:|---:|---:|---:|---:|---:|
| UPI fixed T+1/T+2/T+3 | NPCI-calibrated | 5,426.6 | 828.0 | ₹2,198,920.72 | ₹1,775,067.52 | ₹327.20 | 0 |
| UPI Recovery Loop | NPCI-calibrated | 1,915.4 | 546.0 | ₹1,446,109.38 | ₹1,029,182.38 | ₹537.24 | 3,001.8 |
| Cards fixed T+1/T+2/T+3 | Simulated | 3,484.2 | 1,070.2 | ₹2,831,040.05 | ₹2,410,710.05 | ₹691.73 | 1,084.8 |
| Cards Recovery Loop | Simulated | 1,572.2 | 811.6 | ₹2,142,141.12 | ₹1,725,401.72 | ₹1,096.84 | 2,960.2 |

At that superseded three-day setting, Recovery Loop was positive in **0/5 seeds on both rails**. Its paired mean was −₹745,885.15 on UPI and −₹685,308.32 on Cards. `[Superseded in-sample evidence]` [Artifact](data/evaluation/fix7-npci-calibrated.json)

The old 1.9x UPI and 1.7x Cards efficiency figures apply only to that superseded three-day table and are no longer headline claims.

That table is the frozen original configuration, not the final causal interpretation. The unchanged-policy cap sweep produced:

| Deferral cap | UPI paired net difference / positive seeds | UPI stranded | Cards paired net difference / positive seeds | Cards stranded |
|---:|---:|---:|---:|---:|
| 3 days | −₹745,885 / 0/5 | 3,001.8 | −₹685,308 / 0/5 | 2,960.2 |
| 7 days | −₹1,411,726 / 0/5 | 3,501.0 | −₹973,118 / 0/5 | 3,178.2 |
| 14 days | +₹995,405 / 5/5 | 55.6 | +₹19,557 / 3/5 | 1,785.0 |
| 21 days | +₹274,243 / 5/5 | 55.6 | −₹299,287 / 0/5 | 1,785.0 |
| 28 days | +₹386,271 / 5/5 | 55.6 | −₹273,289 / 0/5 | 1,785.0 |
| 30-day horizon | +₹386,271 / 5/5 | 55.6 | −₹273,289 / 0/5 | 1,785.0 |
| 35 days | +₹386,271 / 5/5 | 55.6 | −₹273,289 / 0/5 | 1,785.0 |

`[Superseded in-sample exploration]` These rows motivated the held-out procedure but are not confirmatory. The non-monotonic recovery counts are reported as measured.

## How the agent decides

1. **Read the failure tuple.** Diagnose on `(error_source, error_step, error_reason)`; an unknown tuple is a terminal refusal. `error_code` is secondary evidence and cannot make an event retryable. [Taxonomy](data/failure_taxonomy.json)
2. **Enforce hard stops.** A non-retryable diagnosis, issuer/Merchant Advice Code stop, exhausted mandate cap, or expired horizon becomes `refuse_terminal` and is never revisited. [Policy tests](tests/policy.test.mjs)
3. **Check issuer health.** Compare the issuer's current decline rate with its own baseline; an outage or abnormal deviation becomes `wait`, not a terminal refusal. `[NPCI-calibrated in UPI mode]` [Evaluation protocol](docs/EVALUATION.md)
4. **Score legal future slots.** Estimate recovery from observable state only, then apply rail timing rules before considering a retry. Hidden salary dates, outage-clear time, and outcome draws never enter the decision. `[Simulated outcomes]` [Outcome model](sim/outcomes.mjs)
5. **Price this mandate's attempt.** Backward induction over `(attempts_remaining, days_remaining)` computes the value of preserving one of this mandate's non-transferable retries for a better slot. [Mandate opportunity model](src/policy/mandate-opportunity.mjs)
6. **Retry or wait.** Retry when expected recovery value covers the mandate-local price; otherwise wait and re-evaluate with fresh state. Waiting costs no attempt. The held-out evaluation uses the selection-set choice of 14 days; the runtime default remains three days unless configured. At the cap, the plain rule decides. `[Simulated policy]` [Scheduler](src/policy/scheduler.mjs)

```text
diagnosis = diagnose(error_source, error_step, error_reason)

if diagnosis is unknown or non_retryable:
    REFUSE_TERMINAL
if issuer_stop or attempt_cap_exhausted or horizon_expired:
    REFUSE_TERMINAL
if issuer_health_gate says outage_or_spike:
    WAIT and re_evaluate_later

for each rail_legal_future_slot:
    p = recovery_probability(observable_state, slot)
    price = mandate_local_opportunity_cost(attempts_remaining, days_remaining)
    if p * payment_amount >= price:
        RETRY at best qualifying slot

WAIT and re_evaluate_later
```

## Evidence status

### NPCI-calibrated inputs

- AutoPay payer-PSP bank names, monthly volumes, Approved %, Business Decline %, and Technical Decline % for January 2025–June 2026. `[NPCI-calibrated]` [NPCI AutoPay](https://www.npci.org.in/product/ecosystem-statistics/autopay)
- Each bank's volume-weighted baseline decline rate over that calibration window. `[NPCI-calibrated]` [Calibration artifact](data/npci/calibration-2026-08-22.json)
- UPI reportable-incident counts and aggregate downtime; the gate's **7.917882x** deviation trigger is the smallest visible bank-normalized technical-decline elevation in a reportable-incident month and was frozen before rerunning. `[NPCI-calibrated]` [NPCI UPI statistics](https://www.npci.org.in/product/upi/product-statistics)
- NACH destination-bank volume, success %, financial/non-financial business-decline partition, and T+0–T+4 response shares. `[NPCI-calibrated proxy for UPI timing/partition; not Cards]` [NPCI NACH](https://www.npci.org.in/product/ecosystem-statistics/nach) — covers **January 2025 – June 2026**, fetched 22 August 2026, from the `ACH Debit` tab under `Destination Bank Returns` and `Destination Bank Response`. The page opens on the current month, which NPCI has not published yet and which renders `No data found`; change the month and year selectors to a month in the calibration window, then use the page's `Download` control to export that month's table. The captured tables are in [`data/npci/`](data/npci/) and do not depend on the site's default selection.

### Assumptions and simulations

- Payment amounts and hidden customer salary dates. `[Simulated]`
- Repeat-attempt success functions and random outcome draws. `[Simulated]`
- Uniform month sampling and exact placement of incidents whose NPCI source supplies monthly totals but no timestamps. `[Assumption]`
- Financial decline → soft decline and non-financial decline → hard decline interpretation; hard-decline subtype mix. `[Assumption]`
- Retry costs, stop-signal cost, and the **₹415,000** decline-rate stress penalty. `[Assumption]`
- Synthetic Mastercard Advice Code mapping and timing floors. `[Assumption; documented-secondary constraints]`
- Every policy probability, threshold, candidate window, and the three-day deferral bound. `[Assumption]`
- The entire Cards evaluation: no suitable public Indian card-authorization decline baseline was found, and NACH bulk-debit returns are not a valid substitute. `[Simulated]` [Limitations](docs/LIMITATIONS.md)

### Captured test evidence

The repository contains **20 redacted Razorpay test API payment entities captured on 22 August and 1 September 2026**. `[Observed]` Sixteen are failures: 15 permanent `business | payment_initiation | international_transaction_not_allowed` rejections and one `gateway | payment_authorization | payment_failed` card failure. The five domestic-card attempts carry `card.issuer: DCBL`, so issuer-health joining is now evidenced; the dashboard button still injects a simulated outage rather than replaying a measured incident. [Capture inventory](data/raw_events/README.md)

### External benchmarks (real, different rail — sanity check only)

These benchmarks were found after the evaluation was frozen. They sanity-check order of magnitude; they do **not** calibrate UPI AutoPay or Cards, and no reported result was adjusted to match them.

| Benchmark | Verified figure | Evidence boundary |
|---|---|---|
| ONS Monthly Direct Debit failures | **2.26% Total** and **5.74% Fitness facilities**, August 2025, non-seasonally adjusted, **2026 edition**. `[External benchmark; real UK Bacs Direct Debit]` | Insufficient-funds failures divided by attempted Direct Debits; UK Bacs is a different rail. OGL v3.0. [ONS source](https://www.ons.gov.uk/economy/economicoutputandproductivity/output/datasets/monthlydirectdebitfailurerateandaveragetransactionamount) · [local extraction](data/external/ons-direct-debit-failures.md) |
| Minneapolis Fed FedACH study | **About 70%** of returned items in the matched 2006 data were insufficient-funds returns. The source sample began with **1.2 billion** ACH transactions; Table 5 uses **21.6 million** matched returns. `[External benchmark; real US ACH, 2006]` | Different country, era, rail implementation, and return population. The legacy simulator's 42% insufficient-funds mix is 28 percentage points lower; it remains frozen. [Fed paper](https://www.minneapolisfed.org/-/media/files/pubs/bankingpolicy/papers/fpwp_10-03_ach.pdf) |
| GoCardless Success+ | **76%** of failed payments recovered, averaged over **3 retries in 4 weeks**, sample **1,000+**, November 2019. `[External benchmark; real Bacs/GBP product sample]` | Vendor-reported, different rail and retry horizon; used only as a recovery-scale check. [GoCardless source](https://gocardless.com/en-us/blog/success-plus) |

## How the evaluation was corrected

Earlier results in git history are **not comparable** with the final artifact because the outcome process, event schema, lifecycle handling, and constraint model changed. Each correction below was made before accepting the next result; the invalidated artifacts remain documented in [EVALUATION_RESULTS.md](docs/EVALUATION_RESULTS.md).

| Correction | What was wrong | What it did to the numbers | How it was caught and corrected |
|---|---|---|---|
| Circular ground truth | The simulator wrote `latentRecovery = random()` and the evaluator declared success when that draw was below the model's own prediction. | `[Simulated; invalidated]` It manufactured an apparent advantage; the uncommitted output is not preserved as machine-readable evidence, so its old headline values are not repeated here. | Direct code inspection found the model grading itself. A shared hidden-world outcome function now uses salary date, outage-clear time, and independent draws that the policy never sees. |
| Simulator/diagnoser schema break | Diagnosis was upgraded to the full failure tuple, but the generator still emitted only `errorCode`. | `[Simulated; invalidated]` Every policy fell through to `unmapped-tuple`, producing 0 recoveries and ₹0 revenue. | Running the evaluator immediately after the diagnosis fix exposed the all-zero result. The generator now draws complete tuples from the same taxonomy and throws on schema drift. |
| Discarded deferrals | The scheduler returned `wait` with a real future time, but the evaluator attempted only rows whose current action was `retry`. | `[Simulated; invalidated]` Deferred work disappeared and understated both attempts and recoveries; that intermediate output is not part of the final evidence artifact. | Comparing scheduled decisions with executed attempts exposed the missing work. Waits now re-enter a bounded fresh-state loop and consume budget only when an attempt occurs. |
| Pooled-vs-per-mandate category error | The evaluator combined separate mandate allowances into one transferable portfolio pool. | `[Simulated; invalidated]` It made rail-specific policies appear equivalent and falsely positioned UPI on a shared-budget curve. | The identical rail results and the non-transferable NPCI rule exposed the mismatch. Per-mandate mode now prices only the attempts belonging to that mandate; the pooled curve remains labelled hypothetical. |
| Zero-attempt artifact | A structural 20–40% NACH baseline was compared with an absolute outage threshold, NACH was misused as a Cards proxy, and the ₹415,000 penalty fired even when a policy made no attempt. | `[Simulated; invalidated]` Cards Recovery Loop reported 0 attempts, 0 recoveries, and −₹415,000 net. | The zero-attempt row made the artifact impossible to interpret. The gate now compares each bank with its own baseline, Cards is uncalibrated, and a zero-attempt policy has exactly ₹0 net and no decline penalty. |
| Refuse/wait conflation | Economic `EV < price` and outage-gate decisions were terminally refused instead of deferred. | `[Simulated; invalidated]` Almost all economic cases were abandoned at the first decision; the intermediate output is not part of the final evidence artifact. | The decision breakdown exposed the unreachable wait path. Hard stops now use `refuse_terminal`; economic and gate outcomes use `wait`, producing the final UPI result of 1,915.4 attempts and 546.0 recoveries. `[NPCI-calibrated]` |

### Superseded in-sample diagnostic audit

- **Deferral cap:** the first 3/7/14/21/28/30/35-day sweep overturned the general UPI-loss interpretation. Its +₹995,405 five-seed 14-day value is superseded by the held-out result above. `[In-sample exploration]`
- **Horizon price:** an audit found ₹8.40 UPI and ₹11.50 Cards still charged at `days_left = 0`; the corrected price is exactly zero. `[Corrected implementation]`
- **Cause attribution:** economic pricing produces about 5,891.6 UPI waits per seed; the outage gate touches only 23 decisions across all five seeds and novelty touches none. Disabling both gates changes mean UPI net by −₹432 and Cards by ₹0. `[Simulated ablation]`
- **Predictor fit:** UPI bank effects now equal each bank's NPCI volume-weighted approved-rate deviation from the pooled rate; category bases remain declared assumptions. `[NPCI-calibrated relative bank effect]`
- **Off-policy check:** IPW and doubly robust estimates differ from on-policy UPI net by −3.74% and −3.14%; Cards gaps are +0.51% and −0.11%. `[Simulated logged-policy check]`
- **Authored-world sensitivity:** all one-at-a-time ±25% perturbations preserve the three-day loss at 0/5 wins, but the cap sweep proves the broader conclusion is not stable to the deferral-bound assumption. `[Simulated sensitivity]`

## How this was built

Implementation and documentation were produced with coding agents working from my direction and review. I selected the problem, challenged the evaluation design, and decided when evidence was insufficient and a result had to be invalidated or rebuilt; the agents performed substantial implementation, debugging, analysis, and writing. The correction history above records that collaboration. Commits use the agent author identity, while the repository preserves both the agent's work and my documented judgment without presenting either as solely responsible.

## Rail constraints modelled

- **UPI AutoPay:** one original attempt plus at most three retries per mandate; retries are non-transferable and must execute in non-peak hours. `[Real rule]` [NPCI UPI circular index](https://www.npci.org.in/circulars/upi) — select 2025 and search for `UPI | OC No. 215 A | FY 2025-26 | Guidelines on usage of UPI APIs` (NPCI's former direct PDF URL now returns 404).
- **Execution windows:** UPI candidates in 10:00–13:00 and 17:00–21:30 IST are moved to the next legal time. `[Documented-secondary timing]` [BSE Clearing notice reproducing the direction](https://noticeblue.com/circulars/da33580c-5800-4958-b819-515cee5e80e3)
- **Cards:** the simulation caps retries at three and then halts, matching Razorpay's documented three-retry subscription lifecycle. `[Simulated lifecycle constrained by primary documentation]` [Razorpay notifications](https://razorpay.com/docs/payments/subscriptions/notifications/)
- **Mastercard stops:** Advice Codes `03` and `21` are hard stops; `24`–`30` impose increasing waits. `[Documented-secondary]` [Braintree MAC table](https://developer.paypal.com/braintree/docs/reference/general/merchant-responses/merchant-advice-codes) · [Visa Acceptance association-code reference](https://support.visaacceptance.com/knowledgebase/knowledgearticle/?code=000003859)

The scheduler enforces NPCI non-peak execution windows before an attempt can run. The former candidate-count comparison was removed because it is not retained in the final machine-readable artifact; no quantitative compliance multiplier is claimed. `[Documented constraint; Simulated enforcement]` [Evaluation results](docs/EVALUATION_RESULTS.md)

## Limitations

1. **No public real merchant retry dataset was found.** The project has no attempt-level production outcomes. Card-payment records sit inside environments governed by card-network rules and PCI DSS protections; merchant retry performance is also competitively sensitive. `[Primary security constraint; competitive-sensitivity explanation is an assumption]` [PCI DSS](https://www.pcisecuritystandards.org/standards/pci-dss/) · [Mastercard rules](https://www.mastercard.us/en-us/business/overview/support/rules.html)
2. **The original three-day deferral cap manufactures most UPI stranding.** It fired for 99.8% of the original in-sample UPI deferrals. In held-out validation, stranding is 57.8 at the frozen 14-day cap and UPI is positive in 10/10 seeds; the robustness curve stays positive from 14 days through the horizon. This is simulator evidence, not production uplift. `[NPCI-calibrated inputs; Simulated outcomes]` [Held-out validation](data/evaluation/heldout-cap-validation.json)
3. Five deterministic seeds and 10,000 synthetic failures per rail expose seed spread but are not confidence intervals over merchant payments. `[Simulated]`
4. NPCI incident data is monthly and covers reportable incidents; exact timestamps are unavailable, smaller incidents can be absent, and no listed incident does not prove zero downtime. `[NPCI-calibrated limitation]` [NPCI UPI statistics](https://www.npci.org.in/product/upi/product-statistics)
5. The 20 observed test API entities contain only 16 failures and only two failure tuples; the single new gateway tuple is generic, and none measures repeat-attempt recovery. `[Observed]` [Capture README](data/raw_events/README.md)
6. A UPI failure capture could not be exercised: this test account's Standard Checkout exposed only QR/Intent, not a VPA-entry field, so the documented `failure@razorpay` test handle could not be entered. The attempted slot was completed with a domestic card and is recorded as such. `[Observed test limitation]` [Capture README](data/raw_events/README.md)
7. Cards are entirely uncalibrated because public NACH return rates describe bulk debit, not card authorization. `[Simulated Cards]`
8. The ₹415,000 decline-rate penalty is a frozen stress-test offset, not a current network fine schedule. It is computed from each policy's own attempts; zero attempts incur zero penalty. `[Assumption]`
9. The recovery score is a transparent deterministic model, not a model trained on merchant history. `[Simulated]`
10. Execution is locked to Razorpay test mode; no live payment is attempted by this repository. `[Observed code boundary]` [Executor](src/execute/razorpay.mjs)

Further detail: [LIMITATIONS.md](docs/LIMITATIONS.md).

## What I would do next

1. Validate the held-out 14-day result against de-identified merchant retry histories; do not deploy the simulator-selected cap as a production threshold. `[Proposed evidence]`
2. Obtain de-identified merchant attempt histories containing issuer, rail, failure tuple, scheduled time, and eventual outcome under a PCI-DSS-controlled data agreement. `[Proposed evidence]`
3. Run a live, capped A/B test against the fixed ladder with identical eligible mandates, per-mandate caps, legal execution windows, and total revenue plus rupees-per-attempt reported together. `[Proposed experiment]`

## How to run it

Requirements: Node.js 22.13 or newer. `[Repository configuration]` [package.json](package.json)

```bash
npm ci
npm test
npm run dev
```

Open `http://localhost:3000`. The dashboard reads the final evidence artifact and runtime APIs; the issuer-outage button runs a labelled simulation.

To reproduce the frozen evaluation artifacts separately (optional; this rewrites the committed JSON evidence deterministically):

```bash
npm run evaluate:fix7
```

For Razorpay test-mode capture only:

```bash
copy .env.example .env.local
npm run test-lab:create -- 20
npm run test-lab:collect
```

Use test credentials only. Configure a signed webhook at `/api/webhooks/razorpay`; capture-time code removes contact and email fields before writing evidence. [Integration guide](docs/INTEGRATION.md) · [capture workflow](docs/TEST_FAILURE_AUTOMATION.md)

## Sources and evidence tiers

- **Real / primary — NPCI:** [AutoPay ecosystem statistics](https://www.npci.org.in/product/ecosystem-statistics/autopay), [NACH ecosystem statistics](https://www.npci.org.in/product/ecosystem-statistics/nach) (select `ACH Debit` and a month in January 2025 – June 2026, then `Download`; the default current month shows `No data found`), [UPI product statistics](https://www.npci.org.in/product/upi/product-statistics), and the [UPI circular index](https://www.npci.org.in/circulars/upi) (select 2025 and search for `UPI | OC No. 215 A | FY 2025-26 | Guidelines on usage of UPI APIs`). Raw captures include fetch date and source URL in [`data/npci/`](data/npci/).
- **Observed / primary — Razorpay Test API:** [20 redacted payment entities: 16 failures, 3 captured, and 1 created](data/raw_events/README.md), plus the [two observed diagnostic tuples](data/failure_taxonomy.json).
- **Primary product documentation — Razorpay:** [payment retries](https://razorpay.com/docs/payments/subscriptions/payment-retries/?preferred-country=IN), [test subscription lifecycle](https://razorpay.com/docs/payments/subscriptions/test/?preferred-country=IN), [payment downtime API](https://razorpay.com/docs/api/payments/downtime/?preferred-country=IN), [Optimizer dynamic routing](https://razorpay.com/docs/payments/optimizer/dynamic-routing/?preferred-country=IN), and [Optimizer recurring limitation](https://razorpay.com/docs/payments/optimizer/recurring-payments/?preferred-country=IN).
- **Real / primary — security boundary:** [PCI DSS](https://www.pcisecuritystandards.org/standards/pci-dss/) and [Mastercard merchant rules](https://www.mastercard.us/en-us/business/overview/support/rules.html).
- **Documented-secondary:** [BSE Clearing non-peak notice](https://noticeblue.com/circulars/da33580c-5800-4958-b819-515cee5e80e3), [Braintree Merchant Advice Codes](https://developer.paypal.com/braintree/docs/reference/general/merchant-responses/merchant-advice-codes), and [Visa Acceptance association-code reference](https://support.visaacceptance.com/knowledgebase/knowledgearticle/?code=000003859).
- **Assumption / simulated outcome evidence:** [final artifact](data/evaluation/fix7-npci-calibrated.json), [evaluation protocol](docs/EVALUATION.md), [full correction record](docs/EVALUATION_RESULTS.md), and [limitations](docs/LIMITATIONS.md). These are reproducible measurements of a simulator, not production uplift evidence.
- **External benchmarks / real, different rail:** [ONS UK Bacs Direct Debit](data/external/ons-direct-debit-failures.md), [Minneapolis Fed 2006 ACH study](https://www.minneapolisfed.org/-/media/files/pubs/bankingpolicy/papers/fpwp_10-03_ach.pdf), and [GoCardless Success+ Bacs/GBP sample](https://gocardless.com/en-us/blog/success-plus). These are sanity checks only; no model input was fitted to them.
