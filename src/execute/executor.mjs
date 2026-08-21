export async function executeDecision(decision, adapter, options = {}) {
  if (options.mode !== 'test') throw new Error('Recovery Loop execution is locked to test mode.');
  if (decision.action !== 'retry') return { executed: false, action: decision.action, reason: decision.reasons.join('; ') };
  if (!decision.scheduledAt) throw new Error('Retry decision is missing a schedule.');
  if (typeof adapter?.retry !== 'function') throw new Error('A test-mode retry adapter is required.');
  const result = await adapter.retry({ eventId: decision.eventId, scheduledAt: decision.scheduledAt, idempotencyKey: decision.id });
  return { executed: true, action: 'retry', result };
}
