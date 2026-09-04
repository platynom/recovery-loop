# Recording numbers

This is the camera-side reference for the final demo. Headline values come from the single locked run in `data/evaluation/heldout-cap-validation.json`. Earlier five-seed values remain documented as superseded and should not be spoken as findings.

| On-camera claim | Final value | Source / evidence label |
|---|---:|---|
| Razorpay fixed retry days | T+1, T+2, T+3 | Razorpay payment-retries documentation; external primary |
| Optimizer reaction window | within 20 minutes | Razorpay Optimizer documentation; external primary |
| UPI mandate allowance | 1 original attempt + 3 retries | NPCI AutoPay circular; external primary |
| Captured Razorpay test API entities | 20 total: 16 failed, 3 captured, 1 created | committed `data/raw_events/*.json`; Observed test-mode evidence |
| Seed split | 5 selection; 10 validation | `EVALUATION.md`; registered before the run |
| Frozen cap | 14 days | selected on seeds `20260901`–`20260905`, then frozen |
| Failed mandates per rail and horizon | 2,000; 30 days | held-out validation artifact |
| UPI Recovery Loop | 4,491.4 attempts; 1,230.4 recoveries; ₹3,279,340.63 gross; ₹2,857,357.83 net; ₹636.30 net/attempt; 57.8 stranded | held-out validation; NPCI-calibrated inputs, simulated outcomes |
| UPI fixed ladder | 5,406.3 attempts; 838.5 recoveries; ₹2,212,896.20 gross; ₹1,789,083.60 net; ₹330.94 net/attempt; 0 stranded | held-out validation |
| UPI headline | +₹1,068,274.23 paired net; range +₹850,537.93 to +₹1,205,356.57; 10/10 positive seeds | held-out validation |
| UPI robustness range | Positive at 14, 21, 28, 30, and 35 days; negative at 3 and 7 | held-out validation curve |
| Cards Recovery Loop | 2,674.1 attempts; 1,071.4 recoveries; ₹2,840,020.74 gross; ₹2,421,077.94 net; ₹905.73 net/attempt; 1,783.8 stranded | held-out validation; Simulated |
| Cards fixed ladder | 3,527.4 attempts; 1,065.2 recoveries; ₹2,820,726.26 gross; ₹2,400,311.07 net; ₹680.71 net/attempt; 1,081.2 stranded | held-out validation; Simulated |
| Cards conclusion | **Inconclusive:** +₹20,766.87 paired net; range −₹76,373.97 to +₹135,507.33; 6/10 positive seeds | held-out validation; Simulated |
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

Final interpretation: held-out UPI validation is positive across the broad 14-day-through-horizon range. Cards is inconclusive and must never be described as a win. Superseded camera values include the five-seed +₹995,405 UPI row, the 1.9×/1.7× three-day ratios, and all earlier unvalidated headlines.
