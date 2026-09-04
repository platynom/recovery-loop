# Numeric consistency sweep

Checked on 4 September 2026 against `fix7-npci-calibrated.json`, `deferral-cap-sweep.json`, the rendered dashboard runtime, committed observed-event files, and cited external sources. The dashboard deliberately remains the three-day reference configuration; the README, video, results, and recording sheet also state the cap-dependent final interpretation. All final disagreements: **none**.

## Cross-artifact matrix

| Claim | Canonical value | README | Video script | Evaluation results | Limitations | Dashboard runtime | Status / origin |
|---|---:|---:|---:|---:|---:|---:|---|
| Evaluation scale | 5 seeds; 2,000 failures/rail; 30 days | same | 5 seeds | same | 5 seeds; 10,000 total/rail | — | Match; final JSON |
| UPI gross efficiency | 1.9× | 1.9× | 1.9× spoken | 1.9× | — | 1.9× | Match; ₹754.99 / ₹405.21, final JSON |
| Cards gross efficiency | 1.7× | 1.7× | 1.7× spoken | 1.7× | — | 1.7× | Match; ₹1,362.51 / ₹812.54, final JSON |
| UPI Recovery Loop attempts / recoveries | 1,915.4 / 546.0 | same | same | same | — | 1,915.4 used; recoveries not shown | Match; final JSON |
| UPI ladder attempts / recoveries | 5,426.6 / 828.0 | same | same | same | — | 5,426.6 used; recoveries not shown | Match; final JSON |
| Cards Recovery Loop attempts / recoveries | 1,572.2 / 811.6 | same | 811.6 spoken | same | — | 1,572.2 used; recoveries not shown | Match; final JSON |
| Cards ladder attempts / recoveries | 3,484.2 / 1,070.2 | same | 1,070.2 spoken | same | — | 3,484.2 used; recoveries not shown | Match; final JSON |
| UPI RL / ladder gross | ₹1,446,109.38 / ₹2,198,920.72 | same | same | same | — | same | Match; final JSON |
| Cards RL / ladder gross | ₹2,142,141.12 / ₹2,831,040.05 | same | — | same | — | same | Match; final JSON |
| UPI paired net difference | −₹745,885.15; range −₹828,549.66 to −₹682,672.59 | same magnitude/range | total loss, 0/5 | same | — | −₹745,885 | Match; dashboard rounds to whole rupees |
| Cards paired net difference | −₹685,308.32; range −₹792,387.78 to −₹584,358.98 | same magnitude/range | total loss, 0/5 | same | — | −₹685,308 | Match; dashboard rounds to whole rupees |
| Seeds won | UPI 0/5; Cards 0/5 | same | same | same | — | same | Match; final JSON |
| UPI stranded attempts | RL 3,001.8; ladder 0 | same | 3,001.8 | same | — | same | Match; final JSON |
| Cards stranded attempts | RL 2,960.2; ladder 1,084.8 | same | 2,960.2 | same | — | same | Match; final JSON |
| UPI deferral cap | 1,963.8 / 1,968.6 = 99.8% | same | 99.8% spoken | same | mechanism stated | — | Match; final JSON |
| UPI 14-day result | +₹995,405; 5/5; 55.6 stranded | same | same | same | cap artefact stated | — | Match; cap sweep |
| UPI horizon result | +₹386,271; 5/5; 55.6 stranded | same | same | same | cap artefact stated | — | Match; cap sweep |
| Cards 14-day result | +₹19,557; 3/5; 1,785.0 stranded | same | same | same | — | — | Match; cap sweep |
| Cards horizon result | −₹273,289; 0/5; 1,785.0 stranded | same | same | same | structural residue stated | — | Match; cap sweep |
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
