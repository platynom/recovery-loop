# Numeric consistency sweep

Checked on 4 September 2026 against the one-time `heldout-cap-validation.json` artifact, the rendered dashboard runtime, superseded exploratory artifacts, committed observed events, and cited external sources. All headline surfaces now use the frozen 14-day held-out result. All final disagreements: **none**.

## Cross-artifact matrix

| Claim | Canonical value | README | Video script | Evaluation results | Limitations | Dashboard runtime | Status / origin |
|---|---:|---:|---:|---:|---:|---:|---|
| Seed split | 5 selection; 10 validation | same | same | same | procedure stated | held-out label | Match; registered protocol |
| Frozen cap | 14 days | same | same | same | same | same | Match; selection artifact |
| UPI validation attempts / recoveries | RL 4,491.4 / 1,230.4; ladder 5,406.3 / 838.5 | same | same | same | — | same | Match; held-out validation |
| UPI validation net | RL ₹2,857,357.83; ladder ₹1,789,083.60 | same | same | same | — | same | Match; held-out validation |
| UPI paired validation | +₹1,068,274.23; +₹850,537.93 to +₹1,205,356.57; 10/10 positive | same | same | same | same | same | Match; held-out validation |
| UPI robust cap range | positive at 14, 21, 28, 30, 35; negative at 3, 7 | same | same | same | same | — | Match; validation curve |
| Cards validation | +₹20,766.87; −₹76,373.97 to +₹135,507.33; 6/10 positive; inconclusive | same | same | same | same | same | Match; held-out validation |
| Cards attempts / recoveries | RL 2,674.1 / 1,071.4; ladder 3,527.4 / 1,065.2 | same | — | same | — | same | Match; held-out validation |
| Cards stranded | RL 1,783.8; ladder 1,081.2 | same | — | same | — | same | Match; held-out validation |
| Superseded three-day efficiency | UPI 1.9×; Cards 1.7× | marked superseded | removed | marked superseded | — | removed | Match; old artifact retained only for audit |
| Superseded in-sample cap row | UPI +₹995,405 / 5 of 5 positive; Cards +₹19,557 / 3 of 5 positive | retained and marked | removed from spoken script | retained and marked | correction noted | replaced | Historical only; not headline evidence |
| Gate ablation | UPI +1.2 attempts, −0.2 recoveries, −₹432 net; Cards 0 | — | — | same | — | — | Match; attribution artifact |
| Off-policy gap | UPI IPW −3.74%, DR −3.14%; Cards +0.51%, −0.11% | — | — | same | — | — | Match; off-policy artifact |
| ±25% authored-rule sensitivity | three-day conclusion survives every perturbation, 0/5 | — | — | same | same | — | Match; sensitivity artifact |
| Observed captures | 20 entities; 16 failures | 20 entities; 16 failures | 20 entities; 16 failures | — | 20 entities; 16 failures | — | Match; committed event count |
| ONS Total / Fitness | 2.26% / 5.74%; Aug 2025; NSA; 2026 edition | same | — | — | — | — | Match; ONS workbook |
| ACH insufficient-funds share | about 70%; 2006 | same | — | — | same | — | Match; Minneapolis Fed paper |
| Legacy simulator insufficient-funds share | 42%; 28 percentage-point gap | same | — | — | same | — | Match; frozen generator assumption |
| GoCardless recovery | 76%; 3 retries/4 weeks; 1,000+ sample; Nov 2019 | same | — | — | — | — | Match; vendor report |
| Decline penalty | ₹415,000 | same | — | assumption listed | same | — | Match; final JSON and evaluator constant |
| Incident deviation trigger | 7.917882× | same | — | — | same | — | Match; final JSON and NPCI calibration artifact |
| Runtime decision illustration | 71.0% probability; ₹15 price; ₹2,219 expected value; 24-hour window | — | fields named, values intentionally not scripted | — | — | same | Match; simulated runtime API, not an evaluation result |

## Claims removed during the sweep

| Removed claim | Reason |
|---|---|
| Older ONS Total value | Wrong edition/adjustment series; the final non-seasonally-adjusted August 2025 value in the 2026 edition is 2.26%. |
| 6,723 versus 445 and 15× prohibited-candidate claim | No occurrence in the final machine-readable evaluation artifact or another retained evaluation JSON. The scheduler's compliance rule remains documented without an unsupported multiplier. |
| Circular-evaluation and intermediate-fix headline values | Those outputs were not retained as machine-readable evidence. The correction mechanism remains documented, but untraceable amounts are not camera-facing claims. |

Timing headings, ordered-list numbers, source publication identifiers, code/API names, and line references were classified as structure or identifiers rather than quantitative findings.
