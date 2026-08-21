# Architecture

## Current slice

The dashboard is a Vinext/React application deployed through OpenAI Sites. It currently runs entirely on deterministic demo data so the product behavior, safety gate, and commercial metrics can be evaluated without credentials or live payment traffic.

## Planned production path

1. A Razorpay test-mode webhook receiver validates signatures and records immutable failure events.
2. A diagnosis layer maps error codes and normalized issuer text into a documented failure taxonomy.
3. A calibrated recovery model estimates recovery probability for candidate time windows.
4. A hard safety gate refuses issuer stop signals, active rail outages, and exhausted attempt budgets.
5. A policy layer chooses the candidate with the highest expected value above its priced attempt threshold.
6. Every input, rule, estimate, and outcome is appended to an audit log and exposed in the decision inspector.

No LLM is permitted to make the retry decision. It may normalize unstructured text or explain already-computed results.

## Business metric

The primary metric is rupees recovered per attempt spent. Secondary measures include recovery at a fixed attempt budget, outage-bound attempts avoided, calibration error, and refused cases that later recovered through another path.
