# Evaluation results after the six-diagnostic audit

All values are five-seed simulator means over seeds `20260818`–`20260822`, 2,000 already-failed mandates per rail, and a 30-day horizon. UPI bank/month inputs are NPCI-calibrated; repeat-attempt outcomes and all Cards results are simulated. No policy threshold or probability was tuned.

## Final finding

The previous headline—“refusal loses on both rails because mandate-local attempts strand”—is **superseded as a general conclusion**. It remains true at the original three-day cap, but that cap manufactures most UPI stranding. With unchanged policy parameters, UPI flips to a 5/5 net-revenue win at 14 days and remains ahead through the 30-day horizon. Cards wins only 3/5 at 14 days, then loses 0/5 at the horizon. The corrected finding is: **selective retry pays in the authored UPI world only when deferral can span the simulated salary cycle; Cards still loses at the full horizon.**

## Reference configuration: three-day cap

| Rail / policy | Retries | Recoveries | Gross | Net | Gross ₹/retry | Net ₹/retry | Stranded |
|---|---:|---:|---:|---:|---:|---:|---:|
| UPI fixed ladder | 5,426.6 | 828.0 | ₹2,198,920.72 | ₹1,775,067.52 | ₹405.21 | ₹327.20 | 0 |
| UPI Recovery Loop | 1,915.4 | 546.0 | ₹1,446,109.38 | ₹1,029,182.38 | ₹754.99 | ₹537.24 | 3,001.8 |
| Cards fixed ladder | 3,484.2 | 1,070.2 | ₹2,831,040.05 | ₹2,410,710.05 | ₹812.54 | ₹691.73 | 1,084.8 |
| Cards Recovery Loop | 1,572.2 | 811.6 | ₹2,142,141.12 | ₹1,725,401.72 | ₹1,362.51 | ₹1,096.84 | 2,960.2 |

At three days Recovery Loop loses 0/5 seeds: paired net −₹745,885.15 on UPI (−₹828,549.66 to −₹682,672.59) and −₹685,308.32 on Cards (−₹792,387.78 to −₹584,358.98). Gross-rupees-per-attempt remains 1.9× UPI and 1.7× Cards.

## Diagnostic 1: complete deferral-cap sweep

| Rail | Cap | Attempts | Recoveries | Gross | Net | Net ₹/attempt | Stranded | Cap hits | Paired net | Seeds won |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| UPI | 3 | 1,915.4 | 546.0 | ₹1,446,109 | ₹1,029,182 | ₹537.24 | 3,001.8 | 1,963.8 | −₹745,885 | 0/5 |
| UPI | 7 | 1,915.4 | 296.4 | ₹780,268 | ₹363,341 | ₹189.63 | 3,501.0 | 1,963.8 | −₹1,411,726 | 0/5 |
| UPI | 14 | 4,531.4 | 1,212.4 | ₹3,192,536 | ₹2,770,473 | ₹611.60 | 55.6 | 1,207.0 | +₹995,405 | 5/5 |
| UPI | 21 | 4,531.4 | 937.6 | ₹2,471,374 | ₹2,049,311 | ₹452.44 | 55.6 | 1,207.0 | +₹274,243 | 5/5 |
| UPI | 28 | 4,531.4 | 971.4 | ₹2,583,401 | ₹2,161,338 | ₹477.18 | 55.6 | 55.6 | +₹386,271 | 5/5 |
| UPI | 30 | 4,531.4 | 971.4 | ₹2,583,401 | ₹2,161,338 | ₹477.18 | 55.6 | 55.6 | +₹386,271 | 5/5 |
| UPI | 35 | 4,531.4 | 971.4 | ₹2,583,401 | ₹2,161,338 | ₹477.18 | 55.6 | 0 | +₹386,271 | 5/5 |
| Cards | 3 | 1,572.2 | 811.6 | ₹2,142,141 | ₹1,725,402 | ₹1,096.84 | 2,960.2 | 814.6 | −₹685,308 | 0/5 |
| Cards | 7 | 1,579.8 | 699.4 | ₹1,854,347 | ₹1,437,592 | ₹909.21 | 3,178.2 | 813.2 | −₹973,118 | 0/5 |
| Cards | 14 | 2,637.2 | 1,086.2 | ₹2,849,136 | ₹2,430,267 | ₹921.60 | 1,785.0 | 491.0 | +₹19,557 | 3/5 |
| Cards | 21 | 2,637.2 | 967.2 | ₹2,530,293 | ₹2,111,423 | ₹800.68 | 1,785.0 | 491.0 | −₹299,287 | 0/5 |
| Cards | 28 | 2,637.2 | 974.2 | ₹2,556,290 | ₹2,137,421 | ₹810.40 | 1,785.0 | 0 | −₹273,289 | 0/5 |
| Cards | 30 | 2,637.2 | 974.2 | ₹2,556,290 | ₹2,137,421 | ₹810.40 | 1,785.0 | 0 | −₹273,289 | 0/5 |
| Cards | 35 | 2,637.2 | 974.2 | ₹2,556,290 | ₹2,137,421 | ₹810.40 | 1,785.0 | 0 | −₹273,289 | 0/5 |

`30` is the full horizon; the non-binding 35-day row therefore matches it. UPI stranding falls from 3,001.8 to 55.6: overwhelmingly a cap artefact. Cards falls from 2,960.2 to 1,785.0: partly cap-driven, with a large structural residue. Non-monotonic recoveries are reported without selection; changed attempt dates alter alignment with authored salary dates and seeded draws.

## Diagnostic 2: horizon opportunity price

The audit found a bug before fixing it: the Bellman component was zero at `days_left = 0`, but a rail base remained, leaving ₹8.40 UPI and ₹11.50 Cards. The corrected attempt price is exactly zero at the boundary. Full `(attempts_remaining, days_left)` tables are in [EVALUATION.md](EVALUATION.md) and `data/evaluation/horizon-boundary.json`.

At the three-day cap, zero mandates on either rail reach the last two days with an unspent attempt—the cap fires first. With a 35-day cap, 55.6 UPI mandates reach that state and strand because the horizon falls inside a prohibited UPI window; Cards has zero last-two-day decisions and strands 1,785.0 through earlier hard/timing resolution.

## Diagnostic 3: what actually refuses

| Rail / seed | Hard stop | Outage gate | Novelty gate | Economic wait | Retry decisions |
|---|---:|---:|---:|---:|---:|
| UPI / 20260818 | 0 | 6 | 0 | 5,868 | 54 |
| UPI / 20260819 | 0 | 4 | 0 | 5,889 | 44 |
| UPI / 20260820 | 0 | 4 | 0 | 5,910 | 46 |
| UPI / 20260821 | 0 | 6 | 0 | 5,868 | 63 |
| UPI / 20260822 | 0 | 3 | 0 | 5,923 | 32 |
| Cards / 20260818 | 585 | 0 | 0 | 2,457 | 764 |
| Cards / 20260819 | 640 | 0 | 0 | 2,418 | 725 |
| Cards / 20260820 | 579 | 0 | 0 | 2,373 | 813 |
| Cards / 20260821 | 566 | 0 | 0 | 2,496 | 753 |
| Cards / 20260822 | 605 | 0 | 0 | 2,475 | 733 |

Economic pricing, not the gates, drives the result. Across 10,000 UPI mandates the outage gate blocks 23 decisions and novelty blocks none. Seven of 23 counterfactual attempts recover (30.4%). Disabling both gates changes UPI by +1.2 attempts, −0.2 recoveries, and −₹432 net on average; Cards changes by zero.

## Diagnostic 4: predictor inventory and NPCI fit

Declared category bases remain assumptions: technical 0.72, insufficient funds 0.48, issuer declined 0.18, mandate inactive 0.04, customer action 0.08, fraud 0.01, non-retryable 0, unknown 0. Frozen adjustments: −0.11 per prior attempt; −1.9 × bank decline excess above 4%; +0.19 near salary day; insufficient-funds delay +0.08 at ≥24 hours or −0.04 otherwise; technical +0.08 at 2–8 hours; active-outage ×0.12; issuer stop 0.01; clamp 0.01–0.95; default delay four hours.

Hand-typed bank effects were replaced by a volume-weighted NPCI fit over January 2025–June 2026. Each adjustment is the bank's AutoPay approved rate minus pooled 0.9784858: Axis −0.0022835, HDFC −0.0008504, ICICI −0.0002127, SBI +0.0082807. It applies only to NPCI-calibrated UPI. Model version: `rule-based-assumptions+npci-relative-bank/2.0.0`. The three-day results remain exactly UPI −₹745,885 and Cards −₹685,308, both 0/5.

## Diagnostic 5: off-policy estimation

A 50/50 stochastic logging policy assigns complete mandate trajectories. Trajectory-level IPW and two-fold cross-fitted doubly robust estimates use only observable category, bank, and ₹1,000 amount band.

| Rail | On-policy net | IPW net / gap | Doubly robust net / gap |
|---|---:|---:|---:|
| UPI | ₹1,029,182 | ₹990,689 / −₹38,494 (−3.74%) | ₹996,884 / −₹32,298 (−3.14%) |
| Cards | ₹1,725,402 | ₹1,734,141 / +₹8,739 (+0.51%) | ₹1,723,566 / −₹1,835 (−0.11%) |

The UPI gap is material enough to disclose but does not reverse the three-day loss. This is still off-policy estimation inside the authored simulator, not merchant-log validation.

## Diagnostic 6: authored ground-truth sensitivity

Each nonzero authored hidden-world rule group was perturbed one at a time by ±25% at the three-day cap. Every scenario remains a loss and wins 0/5 seeds.

| Rule | UPI −25% | UPI +25% | Cards −25% | Cards +25% |
|---|---:|---:|---:|---:|
| Insufficient-funds probability | −₹603,467 | −₹858,234 | −₹637,024 | −₹735,752 |
| Technical probability | −₹745,885 | −₹745,885 | −₹685,308 | −₹685,308 |
| Issuer-declined probability | −₹745,885 | −₹745,885 | −₹619,002 | −₹739,663 |
| Customer-action probability | −₹745,885 | −₹745,885 | −₹685,308 | −₹685,308 |
| Salary-date placement | −₹1,039,738 | −₹980,491 | −₹835,626 | −₹799,892 |
| Outage duration | −₹745,885 | −₹745,885 | −₹685,308 | −₹685,308 |

The default-cap sign survives, but loss magnitude is especially sensitive to salary placement. [LIMITATIONS.md](LIMITATIONS.md) lists every hidden rule and whether it is NPCI-grounded or authored.

## Superseded results retained for auditability

- **Circular evaluation:** the model graded its own prediction; the apparent advantage is invalid.
- **Tuple schema break:** generated events lacked the tuple required by diagnosis, producing 0 recoveries and ₹0.
- **Discarded deferrals:** scheduled waits vanished instead of re-entering the lifecycle.
- **Pooled-budget category error:** mandate-local attempts were treated as a transferable portfolio pool.
- **Zero-attempt artefact:** a wrong Cards proxy and absolute gate produced 0 attempts, while an unconditional penalty produced −₹415,000.
- **Refuse/wait conflation:** economic deferrals became terminal abandonment.
- **Three-day interpretation:** −₹745,885 UPI and −₹685,308 Cards are valid for that configuration, but no longer support a general rail conclusion.

Machine-readable evidence: `fix7-npci-calibrated.json`, `deferral-cap-sweep.json`, `horizon-boundary.json`, `decision-attribution-ablation.json`, `off-policy-estimation.json`, `off-policy-logged-actions.jsonl`, `ground-truth-sensitivity.json`, and `data/npci/predictor-bank-adjustments-2026-09-04.json`.
