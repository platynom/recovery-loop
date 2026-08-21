export function createAuditEntry(event, decision, now = Date.now()) {
  return {
    id: `audit_${event.id}_${now}`,
    eventId: event.id,
    decisionId: decision.id,
    createdAt: now,
    inputs: {
      bank: event.bank,
      rail: event.rail,
      category: event.errorCode,
      attemptNumber: event.attemptNumber,
      issuerStop: event.issuerStop,
      outageActive: event.outageActive,
      bankDeclineRate: event.bankDeclineRate,
    },
    output: {
      action: decision.action,
      probability: decision.probability,
      attemptPrice: decision.attemptPrice,
      expectedValue: decision.expectedValue,
      scheduledAt: decision.scheduledAt,
    },
    reasons: decision.reasons,
    policyVersion: decision.policyVersion,
  };
}
