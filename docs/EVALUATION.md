# Evaluation protocol

## Headline metric

Rupees recovered per attempt spent.

## Required comparisons

- Do nothing
- Razorpay-style fixed T+1/T+2/T+3 ladder
- Payday heuristic
- Plain bank-health threshold
- Recovery Loop

Every active policy is also evaluated at the same fixed attempt budget.

## Generated evidence

`npm run evaluate` deterministically generates 2,000 labeled failures and reports:

- attempts, recoveries, recovery rate, and revenue;
- rupees recovered per attempt;
- attempts spent during an outage;
- revenue at a shared attempt budget;
- risk–coverage curve across six thresholds;
- ten-bin predicted-versus-observed calibration;
- outage censoring population and counterfactual recoverability; and
- up to ten false refusals for manual inspection.

`npm run replay:outage` replays the same seeded population with and without an HDFC outage and reports the number of attempts protected.

## Interpretation boundary

These measurements prove that the code and safety rules behave as designed. They do not prove a real merchant uplift. Replace the generator’s labels with test-mode or historical merchant outcomes before presenting a performance claim externally.
