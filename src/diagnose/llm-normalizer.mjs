import { diagnoseFailure, normalizeIssuerText } from './taxonomy.mjs';

export async function normalizeFailureWithAdapter(input, adapter) {
  const deterministic = diagnoseFailure(input.errorCode, input.errorDescription);
  if (deterministic.category !== 'unknown' || typeof adapter?.normalize !== 'function') return { ...deterministic, normalizedText: normalizeIssuerText(input.errorDescription), usedLlm: false };
  const proposed = await adapter.normalize({ text: normalizeIssuerText(input.errorDescription), allowedCategories: ['technical', 'insufficient_funds', 'issuer_declined', 'mandate_inactive', 'customer_action', 'fraud_risk', 'unknown'] });
  const allowed = new Set(['technical', 'insufficient_funds', 'issuer_declined', 'mandate_inactive', 'customer_action', 'fraud_risk', 'unknown']);
  const category = allowed.has(proposed?.category) ? proposed.category : 'unknown';
  return { category, retryable: false, confidence: Math.min(0.7, Number(proposed?.confidence ?? 0.4)), source: 'llm-normalized-unobserved', normalizedText: normalizeIssuerText(input.errorDescription), usedLlm: true };
}
