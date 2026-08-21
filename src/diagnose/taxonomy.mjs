import taxonomy from '../../data/failure_taxonomy.json' with { type: 'json' };

export function diagnoseFailure(errorCode = '', errorDescription = '') {
  const code = errorCode.trim().toUpperCase();
  const text = errorDescription.trim().toLowerCase();
  for (const entry of taxonomy.categories) {
    if (entry.codes.includes(code) || entry.patterns.some((pattern) => text.includes(pattern))) {
      return { category: entry.category, retryable: entry.retryable, confidence: code ? 0.98 : 0.82, source: entry.source };
    }
  }
  return { category: 'unknown', retryable: false, confidence: 0.35, source: 'fallback' };
}

export function normalizeIssuerText(text = '') {
  return text.trim().replace(/\s+/g, ' ').replace(/[\r\n]/g, ' ').slice(0, 500);
}
