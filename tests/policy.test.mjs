import test from 'node:test';
import assert from 'node:assert/strict';
import { diagnoseFailure } from '../src/diagnose/taxonomy.mjs';
import { decideRecovery } from '../src/policy/scheduler.mjs';
import { generateFailureEvents, runRecoverySimulation } from '../sim/generator.mjs';
import { evaluatePolicies } from '../eval/evaluate.mjs';
import { executeDecision } from '../src/execute/executor.mjs';
import { normalizeFailureWithAdapter } from '../src/diagnose/llm-normalizer.mjs';
import { deterministicExplanation } from '../src/audit/explainer.mjs';

const base = { id: 'evt_1', createdAt: 1, amount: 1299, bank: 'HDFC', rail: 'UPI AutoPay', errorCode: 'GATEWAY_ERROR', errorDescription: 'Bank gateway temporarily unavailable', attemptNumber: 1, issuerStop: false, outageActive: false, bankDeclineRate: 0.02, hour: 10, dayOfMonth: 22 };

test('taxonomy maps known technical failures', () => assert.deepEqual(diagnoseFailure('GATEWAY_ERROR', '').category, 'technical'));
test('unknown errors fail closed', () => assert.equal(diagnoseFailure('SOMETHING_NEW', 'mystery').retryable, false));
test('healthy high-value technical failure is retried', () => assert.equal(decideRecovery(base).action, 'retry'));
test('issuer stop signal is never retried', () => assert.equal(decideRecovery({ ...base, issuerStop: true }).action, 'refuse'));
test('active outage prevents an immediate retry', () => assert.notEqual(decideRecovery({ ...base, outageActive: true, bankDeclineRate: 0.4 }).action, 'retry'));
test('attempt budget is enforced', () => assert.equal(decideRecovery({ ...base, attemptNumber: 3 }).action, 'refuse'));
test('simulation is deterministic for the same seed', () => assert.deepEqual(generateFailureEvents(3, { seed: 7 }), generateFailureEvents(3, { seed: 7 })));
test('every simulation decision has an audit record', () => { const run = runRecoverySimulation({ count: 25 }); assert.equal(run.decisions.length, run.audits.length); });
test('evaluation includes all required baselines', () => { const result = evaluatePolicies({ count: 100 }); assert.deepEqual(result.policies.map((row) => row.name), ['Do nothing', 'T+1 / T+2 / T+3', 'Payday heuristic', 'Plain threshold', 'Recovery Loop']); });
test('evaluation reports fixed-budget and censoring evidence', () => { const result = evaluatePolicies({ count: 200, outageBank: 'HDFC' }); assert.ok(result.fixedBudget > 0); assert.ok(result.policies.every((row) => Number.isFinite(row.revenueAtFixedBudget))); assert.ok(result.censoringExperiment.outagePopulation > 0); });
test('executor cannot run outside test mode', async () => { await assert.rejects(() => executeDecision(decideRecovery(base), { retry: async () => ({ ok: true }) }, { mode: 'live' }), /locked to test mode/); });
test('executor uses an idempotency key in test mode', async () => { let received; const decision = decideRecovery(base); const result = await executeDecision(decision, { retry: async (input) => { received = input; return { ok: true }; } }, { mode: 'test' }); assert.equal(result.executed, true); assert.equal(received.idempotencyKey, decision.id); });
test('LLM normalizer cannot make unknown text retryable', async () => { const result = await normalizeFailureWithAdapter({ errorCode: 'NEW', errorDescription: 'something new' }, { normalize: async () => ({ category: 'technical', confidence: 1 }) }); assert.equal(result.retryable, false); assert.equal(result.confidence, 0.7); });
test('decision explanation is grounded in computed values', () => { const decision = decideRecovery(base); const text = deterministicExplanation(base, decision); assert.match(text, /₹1299/); assert.match(text, /attempt price/); assert.match(text, new RegExp(decision.action, 'i')); });
