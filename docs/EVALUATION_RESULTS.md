# Final frozen evaluation results

All current figures in this document come from `data/evaluation/fix7-npci-calibrated.json`. They are five-seed simulator means, not merchant production measurements. The UPI inputs are NPCI-calibrated; Cards remains an explicitly uncalibrated simulation.

The frozen run uses seeds `20260818`–`20260822`, 2,000 already-failed mandates per rail, a 30-day horizon, and three mandate-local retries. No policy parameter was changed during this consistency sweep and the evaluation was not rerun.

## Final results

| Rail / policy | Evidence mode | Retries | Recoveries | Gross | Net | Gross ₹/retry | Net ₹/retry | Stranded unresolved attempts |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| UPI fixed ladder | NPCI-calibrated inputs | 5,426.6 | 828.0 | ₹2,198,920.72 | ₹1,775,067.52 | ₹405.21 | ₹327.20 | 0 |
| UPI Recovery Loop | NPCI-calibrated inputs | 1,915.4 | 546.0 | ₹1,446,109.38 | ₹1,029,182.38 | ₹754.99 | ₹537.24 | 3,001.8 |
| Cards fixed ladder | Uncalibrated simulator | 3,484.2 | 1,070.2 | ₹2,831,040.05 | ₹2,410,710.05 | ₹812.54 | ₹691.73 | 1,084.8 |
| Cards Recovery Loop | Uncalibrated simulator | 1,572.2 | 811.6 | ₹2,142,141.12 | ₹1,725,401.72 | ₹1,362.51 | ₹1,096.84 | 2,960.2 |

Recovery Loop's gross-rupees-per-retry ratio is **1.9× on UPI** and **1.7× on Cards**, rounded to one decimal. It nevertheless loses total net revenue in every seed on both rails.

| Rail | Mean paired net difference, Recovery Loop − ladder | Seed range | Seeds won |
|---|---:|---:|---:|
| UPI | −₹745,885.15 | −₹828,549.66 to −₹682,672.59 | 0/5 |
| Cards | −₹685,308.32 | −₹792,387.78 to −₹584,358.98 | 0/5 |

## Decision and deferral mechanism

| Rail | Initial terminal refusals | Initial waits | Initial retries | Deferred mandates | Converted to retry | Recovered after deferral | Three-day cap hits |
|---|---:|---:|---:|---:|---:|---:|---:|
| UPI | 0 | 1,968.6 | 31.4 | 1,968.6 | 1,872.4 | 515.6 | 1,963.8 |
| Cards | 595.0 | 814.6 | 590.4 | 814.6 | 814.6 | 227.0 | 814.6 |

The UPI cap binds for **1,963.8 / 1,968.6 = 99.8%** of deferred mandates after rounding to one decimal percentage. This prevents most simulated insufficient-funds cases from waiting through a longer salary cycle.

## Correction record

The repository's evaluation history uncovered six material problems:

1. circular ground truth;
2. simulator/diagnoser schema drift;
3. scheduled deferrals discarded by the evaluator;
4. a transferable pooled budget substituted for non-transferable mandate caps;
5. an absolute outage gate, an invalid NACH-to-Cards proxy, and a penalty charged to a zero-attempt policy;
6. economic waits collapsed into terminal refusals.

Only the final table above is current. Historical numeric claims not retained in the final machine-readable artifact have been removed from this recording-facing document. The earlier peak-window candidate-count multiplier was also removed for that reason. NPCI non-peak execution remains implemented as a documented compliance constraint, not a revenue finding.

## Evidence boundary

- `fix7-npci-calibrated.json` is the source of every evaluation figure above.
- UPI uses published NPCI aggregate inputs with simulated repeat-attempt outcomes.
- Cards is wholly simulated because no suitable public Indian card-authorization decline baseline was found.
- The decline penalty, retry costs, hidden salary dates, repeat-attempt outcomes, policy thresholds, and three-day cap remain frozen assumptions.
- The 20 captured Razorpay test API entities include 16 failures across two tuples; they validate ingestion and an issuer-bearing card join, but do not measure repeat-attempt recovery.
