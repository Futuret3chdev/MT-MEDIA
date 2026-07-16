import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';
import { getSettingValue, STAFF_KEY } from '@/lib/rewards-db';

const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX_ATTEMPTS = 8;

type RateBucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, RateBucket>();

let cachedSessionSecret: string | null = null;

async function sessionSecret(): Promise<string> {
  if (cachedSessionSecret) return cachedSessionSecret;
  const env = process.env.ADMIN_SESSION_SECRET?.trim();
  if (env) {
    cachedSessionSecret = env;
    return cachedSessionSecret;
  }
  const db = await getSettingValue('admin_session_secret');
  cachedSessionSecret = db?.trim() || STAFF_KEY;
  return cachedSessionSecret;
}

export function getRequestCountry(request: NextRequest | Request): string | null {
  const h = request.headers;
  return (
    h.get('x-vercel-ip-country') ||
    h.get('cf-ipcountry') ||
    h.get('x-country-code') ||
    null
  );
}

export function isAustralianRequest(request: NextRequest | Request): boolean {
  if (process.env.ALLOW_NON_AU_ADMIN === 'true') return true;
  const country = getRequestCountry(request);
  if (!country) {
    return process.env.NODE_ENV !== 'production';
  }
  return country.toUpperCase() === 'AU';
}

export function geoBlockedResponse() {
  return Response.json(
    {
      error: 'geo_restricted',
      message: 'Admin access is restricted to Australian connections only.',
    },
    { status: 403, headers: adminSecurityHeaders() }
  );
}

export function adminSecurityHeaders(): HeadersInit {
  return {
    'Cache-Control': 'no-store',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  };
}

export function verifyStaffKey(key: string | null | undefined): boolean {
  if (!key) return false;
  try {
    const a = Buffer.from(key);
    const b = Buffer.from(STAFF_KEY);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function issueAdminSessionToken(): Promise<{ token: string; expires_at: string }> {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = Buffer.from(
    JSON.stringify({ exp, n: randomBytes(12).toString('hex'), v: 2, mfa: true })
  ).toString('base64url');
  const secret = await sessionSecret();
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return {
    token: `${payload}.${sig}`,
    expires_at: new Date(exp).toISOString(),
  };
}

export async function verifyAdminSessionToken(token: string | null | undefined): Promise<boolean> {
  if (!token || !token.includes('.')) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const secret = await sessionSecret();
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof data.exp === 'number' && data.exp > Date.now();
  } catch {
    return false;
  }
}

export function adminTokenFromRequest(request: NextRequest | Request): string | null {
  const h = request.headers;
  return (
    h.get('x-admin-token') ||
    h.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    null
  );
}

export async function isAdminAuthorized(request: NextRequest | Request): Promise<boolean> {
  const token = adminTokenFromRequest(request);
  if (token && (await verifyAdminSessionToken(token))) return true;
  if (process.env.NODE_ENV !== 'production') {
    const staffKeyHeader = request.headers.get('x-staff-key');
    if (staffKeyHeader && verifyStaffKey(staffKeyHeader)) return true;
  }
  return false;
}

export function unauthorizedAdminResponse() {
  return Response.json(
    { error: 'unauthorized', message: 'Valid admin session required.' },
    { status: 401, headers: adminSecurityHeaders() }
  );
}

export function clientIp(request: NextRequest | Request): string {
  const xf = request.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

export function checkAdminRateLimit(request: NextRequest | Request): boolean {
  const ip = clientIp(request);
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  bucket.count += 1;
  if (bucket.count > RATE_MAX_ATTEMPTS) return false;
  return true;
}

export function rateLimitedResponse() {
  return Response.json(
    { error: 'rate_limited', message: 'Too many admin login attempts. Try again later.' },
    { status: 429, headers: adminSecurityHeaders() }
  );
}

export async function requireAdminApiAccess(request: NextRequest): Promise<Response | null> {
  if (!isAustralianRequest(request)) return geoBlockedResponse();
  if (!(await isAdminAuthorized(request))) return unauthorizedAdminResponse();
  return null;
}