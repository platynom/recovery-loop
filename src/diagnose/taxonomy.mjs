import taxonomy from '../../data/failure_taxonomy.json' with { type: 'json' };

const normalized = (value = '') => String(value).trim().toLowerCase();

function diagnosisInput(input, legacyDescription = '') {
  if (input && typeof input === 'object') return input;
  return { errorCode: input, errorDescription: legacyDescription };
}

export function diagnoseFailure(input = {}, legacyDescription = '') {
  const failure = diagnosisInput(input, legacyDescription);
  const errorSource = normalized(failure.errorSource ?? failure.error_source);
  const errorStep = normalized(failure.errorStep ?? failure.error_step);
  const errorReason = normalized(failure.errorReason ?? failure.error_reason);
  const errorCode = normalized(failure.errorCode ?? failure.error_code).toUpperCase();
  const tuple = taxonomy.tuples.find((entry) => normalized(entry.error_source) === errorSource
    && normalized(entry.error_step) === errorStep
    && (normalized(entry.error_reason) === errorReason || entry.error_reason === '*'));

  if (!tuple) return { category: 'unknown', retryable: false, confidence: 0.35, source: 'unmapped-tuple' };

  const codeCorroborates = tuple.error_codes.includes(errorCode);
  return {
    category: tuple.category,
    retryable: tuple.retryable,
    confidence: codeCorroborates ? 0.99 : 0.9,
    source: tuple.source,
  };
}

export function normalizeIssuerText(text = '') {
  return text.trim().replace(/\s+/g, ' ').replace(/[\r\n]/g, ' ').slice(0, 500);
}
