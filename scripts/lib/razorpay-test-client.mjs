const API_ROOT = 'https://api.razorpay.com/v1';

export function loadTestCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (process.env.ENABLE_RAZORPAY_TEST_LAB !== '1') throw new Error('Set ENABLE_RAZORPAY_TEST_LAB=1 in .env.local before running the test lab.');
  if (!keyId?.startsWith('rzp_test_')) throw new Error('RAZORPAY_KEY_ID must be a test-mode key beginning with rzp_test_. Live keys are rejected.');
  if (!keySecret || keySecret === 'replace_with_test_mode_secret') throw new Error('RAZORPAY_KEY_SECRET is missing.');
  return { keyId, keySecret };
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function razorpayRequest(path, init = {}) {
  const { keyId, keySecret } = loadTestCredentials();
  const authorization = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const maxAttempts = 6;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(`${API_ROOT}${path}`, {
      ...init,
      headers: { authorization: `Basic ${authorization}`, 'content-type': 'application/json', ...(init.headers ?? {}) },
    });
    const text = await response.text();
    let body;
    try { body = JSON.parse(text); } catch { body = { raw: text }; }

    if (response.ok) return body;

    if (response.status === 429 && attempt < maxAttempts) {
      const retryAfterSeconds = Number(response.headers.get('retry-after'));
      const delay = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
        ? retryAfterSeconds * 1000
        : Math.min(30_000, 2 ** attempt * 1000);
      console.warn(`Razorpay rate limit reached; retrying in ${Math.ceil(delay / 1000)}s (${attempt}/${maxAttempts - 1})...`);
      await wait(delay);
      continue;
    }

    const message = body?.error?.description ?? body?.error?.reason ?? `Razorpay API returned ${response.status}`;
    throw new Error(message);
  }

  throw new Error('Razorpay request exhausted its retry limit.');
}
