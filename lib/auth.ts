// Uses Web Crypto (globalThis.crypto.subtle) instead of Node's `crypto` module
// so this works in both the Node.js API routes and the Edge middleware runtime.

export const CP_SESSION_COOKIE = 'cp_session';
const TOKEN_VALUE = 'cp-admin-authenticated';

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not set');
  }
  return secret;
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function signSessionToken(): Promise<string> {
  const signature = await hmacHex(getSecret(), TOKEN_VALUE);
  return `${TOKEN_VALUE}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [value, signature] = token.split('.');
  if (value !== TOKEN_VALUE || !signature) return false;

  const expected = await hmacHex(getSecret(), TOKEN_VALUE);
  return timingSafeEqualStrings(expected, signature);
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.CP_ADMIN_PASSWORD;
  if (!expected) return false;
  return timingSafeEqualStrings(candidate, expected);
}
