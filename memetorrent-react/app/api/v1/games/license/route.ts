import { NextRequest } from 'next/server';
import { CORS, v1err, v1ok } from '@/lib/mt-v1';
import { verifyLicenseKey } from '@/lib/dev-license';

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key') || '';
  const v = await verifyLicenseKey(key);
  if (!v.ok) return v1err(v.error || 'Invalid', 401, 401);
  return v1ok({
    product: 'mt-games',
    license_key: v.license_key,
    tier: v.tier,
    handle: v.handle,
    apk: 'https://memetorrent.futuret3ch.com.au/downloads/MTGames.apk',
    sdk: 'https://memetorrent.futuret3ch.com.au/sdk/mt-games.js',
  });
}

export async function POST(request: NextRequest) {
  let body: { key?: string; license?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const v = await verifyLicenseKey(body.key || body.license || '');
  if (!v.ok) return v1err(v.error || 'Invalid', 401, 401);
  return v1ok({
    product: 'mt-games',
    license_key: v.license_key,
    tier: v.tier,
    handle: v.handle,
  });
}
