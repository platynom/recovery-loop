const API_ROOT = 'https://api.razorpay.com/v1';

export function loadTestCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (process.env.ENABLE_RAZORPAY_TEST_LAB !== '1') throw new Error('Set ENABLE_RAZORPAY_TEST_LAB=1 in .env.local before running the test lab.');
  if (!keyId?.startsWith('rzp_test_')) throw new Error('RAZORPAY_KEY_ID must be a test-mode key beginning with rzp_test_. Live keys are rejected.');
  if (!keySecret || keySecret === 'replace_with_test_mode_secret') throw new Error('RAZORPAY_KEY_SECRET is missing.');
  return { keyId, keySecret };
}

export async function razorpayRequest(path, init = {}) {
  const { keyId, keySecret } = loadTestCredentials();
  const authorization = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: { authorization: `Basic ${authorization}`, 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text }; }
  if (!response.ok) {
    const message = body?.error?.description ?? body?.error?.reason ?? `Razorpay API returned ${response.status}`;
    throw new Error(message);
  }
  return body;
}
