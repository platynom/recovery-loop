# Deterministic evaluation results

Generated from `npm run evaluate` with seed `20260822`, 2,000 synthetic failures, and an HDFC outage scenario.

These are **simulation results**, not merchant or Razorpay production claims.

| Policy | Attempts | Recovered | ₹ per attempt | Attempts into outage | Revenue at shared 105-attempt budget |
|---|---:|---:|---:|---:|---:|
| Do nothing | 0 | 0 | ₹0.00 | 0 | ₹0.00 |
| T+1 / T+2 / T+3 | 1,557 | 353 | ₹610.18 | 397 | ₹66,159.47 |
| Payday heuristic | 105 | 45 | ₹1,078.16 | 28 | ₹113,206.84 |
| Plain threshold | 1,127 | 342 | ₹821.67 | 0 | ₹86,546.53 |
| Recovery Loop | 405 | 241 | ₹1,635.42 | 0 | ₹167,036.97 |

## Risk–coverage

As the threshold rises from 0.15 to 0.65, simulated coverage falls from 32.75% to 7.05%, while precision rises from 49.62% to 70.92%. This is the expected abstention trade-off and gives a reproducible way to choose the gate.

## Censoring

All 499 outage-hit failures were refused or delayed. When the outage flag is removed for the counterfactual, 123 are labeled recoverable. This exposes why naive analysis of only attempted payments would hide potentially recoverable outage-hit cases.

## Outage replay

`npm run replay:outage` generated 125 HDFC failures. The normal run scheduled 32 immediate retries; the outage replay scheduled zero, protecting all 32 attempts.

## Honest errors

The evaluator returns ten representative false refusals for inspection. They are intentionally retained in the report rather than hidden, because a useful refusal policy must expose the revenue it may leave behind.
