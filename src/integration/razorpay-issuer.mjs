const objectValue = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export const unresolvedIssuerKey = 'UNRESOLVED_ISSUER';

export function canonicalIssuerKey(...values) {
  const value = values.find((candidate) => typeof candidate === 'string' && candidate.trim());
  if (!value) return null;
  const normalized = String(value).trim().toUpperCase().replace(/[^A-Z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (/\bHDFC\b/.test(normalized)) return 'HDFC';
  if (/\bICICI\b/.test(normalized)) return 'ICICI';
  if (/\bAXIS\b/.test(normalized)) return 'AXIS';
  if (/\bSTATE BANK OF INDIA\b|\bSBI\b/.test(normalized)) return 'SBI';
  return normalized;
}

export function paymentEntity(payload) {
  const payloadRoot = objectValue(payload?.payload);
  const webhookPayment = objectValue(objectValue(payloadRoot.payment).entity);
  const webhookSubscription = objectValue(objectValue(payloadRoot.subscription).entity);
  if (Object.keys(webhookPayment).length) return webhookPayment;
  if (Object.keys(webhookSubscription).length) return webhookSubscription;
  return payload?.entity === 'payment' ? objectValue(payload) : {};
}

export function paymentIssuerKey(payload) {
  const entity = paymentEntity(payload);
  const card = objectValue(entity.card);
  const acquirerData = objectValue(entity.acquirer_data);
  const notes = objectValue(entity.notes);
  return canonicalIssuerKey(card.issuer, entity.bank, entity.issuer, acquirerData.issuer, notes.issuer);
}

export function downtimeIssuerKey(payload) {
  const payloadRoot = objectValue(payload?.payload);
  const entity = objectValue(objectValue(payloadRoot['payment.downtime']).entity);
  const instrument = objectValue(entity.instrument);
  return canonicalIssuerKey(instrument.issuer, instrument.psp, instrument.vpa_handle);
}

export function requireIssuerKey(key, eventId = 'unknown') {
  if (key) return key;
  throw new Error(`issuer_health_join_failed: event ${eventId} has no issuer identifier; refusing to guess from transaction ids`);
}
