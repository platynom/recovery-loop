/** @typedef {'technical'|'insufficient_funds'|'issuer_declined'|'mandate_inactive'|'customer_action'|'fraud_risk'|'unknown'} FailureCategory */
/** @typedef {'retry'|'wait'|'refuse'} Action */

/**
 * @typedef {Object} FailureEvent
 * @property {string} id
 * @property {number} createdAt
 * @property {number} amount
 * @property {string} bank
 * @property {string} rail
 * @property {string} errorCode
 * @property {string} errorDescription
 * @property {number} attemptNumber
 * @property {boolean} issuerStop
 * @property {boolean} outageActive
 * @property {number} bankDeclineRate
 * @property {number} hour
 * @property {number} dayOfMonth
 */

/**
 * @typedef {Object} RecoveryDecision
 * @property {string} id
 * @property {string} eventId
 * @property {Action} action
 * @property {number|null} scheduledAt
 * @property {number} probability
 * @property {number} attemptPrice
 * @property {number} expectedValue
 * @property {string[]} reasons
 * @property {string} policyVersion
 */

export const POLICY_VERSION = 'recovery-loop/1.0.0';
