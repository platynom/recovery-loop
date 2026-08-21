# Limitations

- Dashboard outcomes are simulated and are not production claims.
- Recovery probabilities are representative UI values, not a trained or calibrated model.
- Bank-health statuses are demo scenarios and do not represent current bank availability.
- The annualized commercial value is a scenario model; merchant volume, average ticket size, and real decline composition will change the result.
- No live payment execution is implemented. The project must remain in Razorpay test mode until its safety and audit controls have been verified.
- A fair evaluation requires replaying identical failures through Recovery Loop and fixed retry baselines at the same attempt budget.
- The failure taxonomy begins as documented-not-observed; genuine observed codes require captured Razorpay test-mode payloads.
- D1 persistence is configured but production durability depends on a bound Sites database or equivalent Cloudflare D1 deployment.
- The fixture-only webhook bypass exists for local integration tests and must not be enabled on a public deployment.
- The current attempt price is a transparent scenario model, not a contract-specific Razorpay fee calculation.
