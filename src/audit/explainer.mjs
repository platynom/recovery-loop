export function deterministicExplanation(event, decision) {
  const action = decision.action === 'retry' ? `retry in ${Math.max(1, Math.round((decision.scheduledAt - event.createdAt) / 3600000))} hours` : decision.action;
  return `${action[0].toUpperCase()}${action.slice(1)} the ${event.rail} payment of ₹${event.amount.toFixed(0)} for ${event.bank}. Recovery probability ${(decision.probability * 100).toFixed(1)}%, expected value ₹${decision.expectedValue.toFixed(2)}, attempt price ₹${decision.attemptPrice.toFixed(2)}. ${decision.reasons.join('. ')}.`;
}

export async function explainDecision(event, decision, adapter) {
  const facts = deterministicExplanation(event, decision);
  if (typeof adapter?.explain !== 'function') return { text: facts, usedLlm: false };
  const text = await adapter.explain({ facts, instruction: 'Rewrite only for clarity. Do not add facts, change numbers, or recommend a different action.' });
  return { text: typeof text === 'string' && text.trim() ? text.trim() : facts, usedLlm: true };
}
