# Held-out evaluation results

The headline uses ten held-out validation seeds, 2,000 already-failed mandates per rail, and a 30-day horizon. Five disjoint selection seeds chose the deferral cap before validation. UPI bank/month inputs are NPCI-calibrated; repeat-attempt outcomes and all Cards results are simulated. No policy threshold or probability was tuned.

## Final finding

The selection set chose 14 days by the registered UPI paired-net rule. At that frozen cap, held-out UPI validation is **+₹1,068,274 mean paired net, positive in 10/10 seeds**, with every seed between +₹850,538 and +₹1,205,357. The effect is not confined to one cap: UPI is positive in all ten seeds at 14, 21, 28, 30, and 35 days, and negative at 3 and 7.

Cards is **inconclusive**, not a win: +₹20,767 mean at the frozen cap, 6/10 positive seeds, and a wide −₹76,374 to +₹135,507 range. It is negative in all ten seeds at every validation cap except 14 days.

## Headline validation result: frozen 14-day cap

| Rail / policy | Attempts | Recoveries | Gross | Net | Net ₹/attempt | Stranded |
|---|---:|---:|---:|---:|---:|---:|
| UPI fixed ladder | 5,406.3 | 838.5 | ₹2,212,896.20 | ₹1,789,083.60 | ₹330.94 | 0 |
| UPI Recovery Loop | 4,491.4 | 1,230.4 | ₹3,279,340.63 | ₹2,857,357.83 | ₹636.30 | 57.8 |
| Cards fixed ladder | 3,527.4 | 1,065.2 | ₹2,820,726.26 | ₹2,400,311.07 | ₹680.71 | 1,081.2 |
| Cards Recovery Loop | 2,674.1 | 1,071.4 | ₹2,840,020.74 | ₹2,421,077.94 | ₹905.73 | 1,783.8 |

| Rail | Mean paired net | Validation range | Positive seeds | Interpretation |
|---|---:|---:|---:|---|
| UPI | +₹1,068,274.23 | +₹850,537.93 to +₹1,205,356.57 | 10/10 | Held-out effect survives |
| Cards | +₹20,766.87 | −₹76,373.97 to +₹135,507.33 | 6/10 | Inconclusive |

## Validation robustness curve

| Cap | UPI paired net / positive seeds | Cards paired net / positive seeds |
|---:|---:|---:|
| 3 days | −₹768,571 / 0/10 | −₹714,206 / 0/10 |
| 7 days | −₹1,390,165 / 0/10 | −₹1,003,758 / 0/10 |
| 14 days — frozen | +₹1,068,274 / 10/10 | +₹20,767 / 6/10, inconclusive |
| 21 days | +₹338,368 / 10/10 | −₹298,174 / 0/10 |
| 28 days | +₹440,731 / 10/10 | −₹292,145 / 0/10 |
| 30-day horizon | +₹440,731 / 10/10 | −₹292,145 / 0/10 |
| 35 days | +₹440,731 / 10/10 | −₹292,145 / 0/10 |

UPI is robust across the broad 14–35-day range, not one isolated point. Seven days or less remains decisively negative. The 35-day setting is non-binding and equals the 30-day horizon.

## Superseded in-sample reference: three-day cap

| Rail / policy | Retries | Recoveries | Gross | Net | Gross ₹/retry | Net ₹/retry | Stranded |
|---|---:|---:|---:|---:|---:|---:|---:|
| UPI fixed ladder | 5,426.6 | 828.0 | ₹2,198,920.72 | ₹1,775,067.52 | ₹405.21 | ₹327.20 | 0 |
| UPI Recovery Loop | 1,915.4 | 546.0 | ₹1,446,109.38 | ₹1,029,182.38 | ₹754.99 | ₹537.24 | 3,001.8 |
| Cards fixed ladder | 3,484.2 | 1,070.2 | ₹2,831,040.05 | ₹2,410,710.05 | ₹812.54 | ₹691.73 | 1,084.8 |
| Cards Recovery Loop | 1,572.2 | 811.6 | ₹2,142,141.12 | ₹1,725,401.72 | ₹1,362.51 | ₹1,096.84 | 2,960.2 |

At three days Recovery Loop loses 0/5 seeds: paired net −₹745,885.15 on UPI (−₹828,549.66 to −₹682,672.59) and −₹685,308.32 on Cards (−₹792,387.78 to −₹584,358.98). Gross-rupees-per-attempt remains 1.9× UPI and 1.7× Cards.

## Superseded in-sample five-seed cap exploration

| Rail | Cap | Attempts | Recoveries | Gross | Net | Net ₹/attempt | Stranded | Cap hits | Paired net | Positive seeds |
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

## Diagnostic 6: authored ground-truth sensitivity at the frozen cap

The earlier five-seed, three-day sensitivity supported the superseded three-day loss. It did not test the later 14-day conclusion. The corrected analysis uses UPI only, the frozen 14-day cap, and validation seeds `20260906`–`20260915`. It reproduces the headline baseline exactly: **+₹1,068,274 mean paired net, 10/10 positive seeds**. This is a post-selection sensitivity analysis on reused validation seeds, not a second confirmatory held-out test.

### Authored rules and frozen values

| Hidden-world rule | Frozen value | Evidence status |
|---|---:|---|
| Salary-date support | days 1, 5, 15, 25; equal weight | Authored |
| Salary-day insufficient-funds recovery | 0.82 | Authored |
| First-three-days salary decay | 0.10 probability points/day | Authored |
| Post-salary recovery base | 0.42 | Authored |
| Post-salary exponential decay constant | 7 days | Authored |
| Insufficient-funds recovery floor | 0.06 | Authored |
| Technical recovery during outage | 0.02 | Authored |
| Technical recovery after clearance | 0.76 | Authored |
| Issuer-declined recovery | 0.30, flat | Authored |
| Authentication-failure recovery | 0.26, flat | Authored |
| Active-outage duration | 1.0 × NPCI monthly incident mean; starts at evaluation time | NPCI duration, authored placement |
| NACH non-financial share mapped to hard decline | 1.0 × published share | NPCI partition, authored interpretation |
| Hard-decline subtype weights | issuer 12; authentication 9; mandate inactive 5; non-retryable 2 | Authored |
| Mandate-inactive recovery | exactly 0 | Structural authored hard stop |
| Non-retryable recovery | exactly 0 | Structural authored hard stop |
| Failure-class mix | each bank/month's NPCI BD:TD odds | NPCI-backed input, perturbed as requested |

NPCI months remain sampled uniformly; an active incident begins at evaluation time because timestamps are unavailable; and attempts use seeded `Uniform(0,1)` outcome draws. These are structural simulation choices without a scalar ±25% interpretation. The active-incident timing is exercised through the duration perturbation. The zero-probability hard stops remain zero under multiplicative perturbation.

### One-at-a-time results

Each scalar rule was multiplied independently by 0.75 and 1.25. Salary support shifts all four support days by that factor, rounded and clamped to days 1–30. Failure-class mix scales the NPCI technical-versus-business odds, preserving the published mix at 1.0.

| Rule | −25% paired net / positive seeds | +25% paired net / positive seeds |
|---|---:|---:|
| Salary-date support | +₹1,342,112 / 10/10 | +₹1,370,194 / 10/10 |
| Salary-day recovery probability | +₹911,807 / 10/10 | +₹1,128,505 / 10/10 |
| First-three-days salary decay | +₹1,076,295 / 10/10 | +₹1,059,078 / 10/10 |
| Post-salary recovery base | +₹1,051,017 / 10/10 | +₹1,113,929 / 10/10 |
| Post-salary decay constant | +₹1,083,836 / 10/10 | +₹1,093,658 / 10/10 |
| Insufficient-funds floor | +₹1,137,464 / 10/10 | +₹1,014,433 / 10/10 |
| Technical recovery during outage | +₹1,068,274 / 10/10 | +₹1,068,274 / 10/10 |
| Technical recovery after clearance | +₹1,068,274 / 10/10 | +₹1,068,274 / 10/10 |
| Issuer-declined recovery | +₹1,068,274 / 10/10 | +₹1,068,274 / 10/10 |
| Authentication-failure recovery | +₹1,068,274 / 10/10 | +₹1,068,274 / 10/10 |
| Outage duration | +₹1,068,274 / 10/10 | +₹1,068,274 / 10/10 |
| NPCI failure-class mix | +₹1,014,604 / 10/10 | +₹984,770 / 10/10 |
| Mapped hard-decline share | +₹1,068,274 / 10/10 | +₹1,068,274 / 10/10 |
| Hard subtype: issuer weight | +₹1,068,274 / 10/10 | +₹1,068,274 / 10/10 |
| Hard subtype: authentication weight | +₹1,068,274 / 10/10 | +₹1,068,274 / 10/10 |
| Hard subtype: mandate-inactive weight | +₹1,068,274 / 10/10 | +₹1,068,274 / 10/10 |
| Hard subtype: non-retryable weight | +₹1,068,274 / 10/10 | +₹1,068,274 / 10/10 |
| Mandate-inactive zero | +₹1,068,274 / 10/10 | +₹1,068,274 / 10/10 |
| Non-retryable zero | +₹1,068,274 / 10/10 | +₹1,068,274 / 10/10 |

**The UPI win survives every independent ±25% perturbation.** The least favourable one-at-a-time row is a 25% reduction in salary-day recovery: +₹911,807 mean paired net, with all ten seeds positive and a +₹727,826 to +₹1,027,412 spread. No tested perturbation changes the sign, so a smallest sign-changing perturbation is not identified within ±25%.

The mapped hard-share and hard-subtype rows are inert because these ten calibrated cohorts contain 19,654 insufficient-funds events and 346 technical events, but zero mapped hard-decline events. That is a coverage limitation, not evidence that those assumptions are harmless.

For the combined worst case, every non-invariant rule was set to whichever ±25% direction had the lower one-at-a-time mean; ties use −25%. The combined result is **+₹1,085,508 mean paired net, 10/10 positive seeds**, range +₹1,027,087 to +₹1,171,469. It therefore preserves the sign, although interactions make it less adverse than the weakest single row. Full per-seed evidence and the chosen directions are in `ground-truth-sensitivity-14d-validation.json`.

## Superseded results retained for auditability

- **Circular evaluation:** the model graded its own prediction; the apparent advantage is invalid.
- **Tuple schema break:** generated events lacked the tuple required by diagnosis, producing 0 recoveries and ₹0.
- **Discarded deferrals:** scheduled waits vanished instead of re-entering the lifecycle.
- **Pooled-budget category error:** mandate-local attempts were treated as a transferable portfolio pool.
- **Zero-attempt artefact:** a wrong Cards proxy and absolute gate produced 0 attempts, while an unconditional penalty produced −₹415,000.
- **Refuse/wait conflation:** economic deferrals became terminal abandonment.
- **Three-day interpretation:** −₹745,885 UPI and −₹685,308 Cards are valid for that configuration, but no longer support a general rail conclusion.

Headline machine-readable evidence: `heldout-cap-selection.json` and `heldout-cap-validation.json`. Superseded and diagnostic evidence: `fix7-npci-calibrated.json`, `deferral-cap-sweep.json`, `horizon-boundary.json`, `decision-attribution-ablation.json`, `off-policy-estimation.json`, `off-policy-logged-actions.jsonl`, `ground-truth-sensitivity.json`, and `data/npci/predictor-bank-adjustments-2026-09-04.json`.
