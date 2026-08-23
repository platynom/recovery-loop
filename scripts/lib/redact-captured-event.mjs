const redactedFieldNames = new Set(['email', 'contact', 'customer_email', 'customer_contact']);

export function redactCapturedEvent(value) {
  if (Array.isArray(value)) return value.map(redactCapturedEvent);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !redactedFieldNames.has(key.toLowerCase()))
    .map(([key, nested]) => [key, redactCapturedEvent(nested)]));
}

export function containsContactOrEmailField(value) {
  if (Array.isArray(value)) return value.some(containsContactOrEmailField);
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, nested]) => redactedFieldNames.has(key.toLowerCase()) || containsContactOrEmailField(nested));
}

export const capturedEventRedactedFields = Object.freeze([...redactedFieldNames]);
