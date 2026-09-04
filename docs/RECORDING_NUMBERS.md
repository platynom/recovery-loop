# Recording numbers

This is the camera-side reference for the final demo. Three-day reference values come from `data/evaluation/fix7-npci-calibrated.json`; cap-sensitivity values come from `data/evaluation/deferral-cap-sweep.json`. Figures labelled runtime-simulated are illustrative decision inputs, not performance claims.

| On-camera claim | Final value | Source / evidence label |
|---|---:|---|
| Razorpay fixed retry days | T+1, T+2, T+3 | Razorpay payment-retries documentation; external primary |
| Optimizer reaction window | within 20 minutes | Razorpay Optimizer documentation; external primary |
| UPI mandate allowance | 1 original attempt + 3 retries | NPCI AutoPay circular; external primary |
| Captured Razorpay test API entities | 20 total: 16 failed, 3 captured, 1 created | committed `data/raw_events/*.json`; Observed test-mode evidence |
| Evaluation seeds | 5 | `fix7-npci-calibrated.json` |
| Failed mandates per rail and retry horizon | 2,000; 30 days | `fix7-npci-calibrated.json` |
| UPI gross efficiency ratio | 1.9× | computed from ₹754.99 / ₹405.21 in `fix7-npci-calibrated.json` |
| UPI Recovery Loop | 1,915.4 attempts; 546.0 recoveries; ₹1,446,109.38 gross; ₹1,029,182.38 net | `fix7-npci-calibrated.json`; NPCI-calibrated inputs, simulated outcomes |
| UPI fixed ladder | 5,426.6 attempts; 828.0 recoveries; ₹2,198,920.72 gross; ₹1,775,067.52 net | `fix7-npci-calibrated.json`; NPCI-calibrated inputs, simulated outcomes |
| UPI paired net result | −₹745,885.15; 0/5 seeds won | `fix7-npci-calibrated.json` |
| UPI stranded unresolved attempts | 3,001.8 Recovery Loop; 0 ladder | `fix7-npci-calibrated.json` |
| UPI deferral-cap binding | 1,963.8 / 1,968.6 = 99.8% | `fix7-npci-calibrated.json` |
| UPI 14-day crossover | +₹995,405 paired net; 5/5 seeds won; 55.6 stranded | `deferral-cap-sweep.json`; NPCI-calibrated inputs, simulated outcomes |
| UPI full-horizon result | +₹386,271 paired net; 5/5 seeds won; 55.6 stranded | `deferral-cap-sweep.json`; NPCI-calibrated inputs, simulated outcomes |
| Cards gross efficiency ratio | 1.7× | computed from ₹1,362.51 / ₹812.54 in `fix7-npci-calibrated.json` |
| Cards Recovery Loop | 1,572.2 attempts; 811.6 recoveries; ₹2,142,141.12 gross; ₹1,725,401.72 net | `fix7-npci-calibrated.json`; Simulated |
| Cards fixed ladder | 3,484.2 attempts; 1,070.2 recoveries; ₹2,831,040.05 gross; ₹2,410,710.05 net | `fix7-npci-calibrated.json`; Simulated |
| Cards paired net result | −₹685,308.32; 0/5 seeds won | `fix7-npci-calibrated.json` |
| Cards stranded unresolved attempts | 2,960.2 Recovery Loop; 1,084.8 ladder | `fix7-npci-calibrated.json` |
| Cards 14-day crossover | +₹19,557 paired net; 3/5 seeds won; 1,785.0 stranded | `deferral-cap-sweep.json`; Simulated |
| Cards full-horizon result | −₹273,289 paired net; 0/5 seeds won; 1,785.0 stranded | `deferral-cap-sweep.json`; Simulated |
| Gate ablation | UPI +1.2 attempts, −0.2 recoveries, −₹432 net; Cards exactly unchanged | `decision-attribution-ablation.json`; Simulated |
| UPI outage-gate counterfactual | 23 blocked decisions; 7 would recover = 30.4% | `decision-attribution-ablation.json`; Simulated |
| UPI off-policy check | IPW −3.74%; doubly robust −3.14% versus on-policy net | `off-policy-estimation.json`; Simulated |
| Ground-truth sensitivity | all ±25% one-at-a-time scenarios remain 0/5 wins at the three-day cap | `ground-truth-sensitivity.json`; Simulated |
| Documented corrections | 6 | README correction table; only the final evaluation values are current |
| ONS Total failure rate | 2.26%, August 2025, non-seasonally adjusted, 2026 edition | ONS UK Bacs Direct Debit; external real different-rail benchmark |
| ONS Fitness facilities failure rate | 5.74%, August 2025, non-seasonally adjusted, 2026 edition | ONS UK Bacs Direct Debit; external real different-rail benchmark |
| Minneapolis Fed insufficient-funds mix | about 70%; 2006 data; 1.2 billion source transactions and 21.6 million matched returns | Minneapolis Fed FedACH paper; external real different-rail benchmark |
| Legacy simulator insufficient-funds mix | 42%; 28 percentage points below the Fed benchmark | frozen simulator assumption; not retuned |
| GoCardless Success+ | 76% recovered; 3 retries over 4 weeks; sample 1,000+; November 2019 | GoCardless vendor report; external real different-rail benchmark |
| Decision inspector during verified local run | 71.0% p(success); ₹15 attempt price; ₹2,219 expected value; 24-hour best window | `/api/simulation`, seed `20260822`; runtime-simulated illustration, not an evaluation claim |
| Attempt-budget panel | 6,000 mandate-local retry tokens per rail | 2,000 mandates × 3 retries in `fix7-npci-calibrated.json` |

Final interpretation: the three-day loss remains a valid configuration result, but the blanket rail conclusion is superseded. UPI wins 5/5 from 14 days through the full horizon; Cards wins only 3/5 at 14 days and loses 0/5 at the horizon. Removed from camera-facing material: the old ONS value, the unsupported peak-window candidate multiplier, and circular-evaluation headline values that were not retained in committed machine-readable evidence.
