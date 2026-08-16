import { NextRequest } from 'next/server';
import { upgradeToPro } from '@/lib/dev-license';
import { publicUser, readSessionToken, userBySession } from '@/lib/portal-auth';

export async function GET() {
  const me = await userBySession(await readSessionToken());
  if (!me) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  return Response.json({
    ok: true,
    license_key: me.license_key,
    license_tier: me.license_tier || 'free',
  });
}

export async function POST(request: NextRequest) {
  const me = await userBySession(await readSessionToken());
  if (!me) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  let body: { action?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  if (body.action !== 'upgrade') {
    return Response.json({ ok: false, error: 'Use action: upgrade' }, { status: 400 });
  }
  if ((me.license_tier || 'free') === 'pro') {
    return Response.json({
      ok: true,
      already: true,
      license_key: me.license_key,
      license_tier: 'pro',
      user: publicUser(me),
    });
  }
  const lic = await upgradeToPro(me.email, me.username);
  return Response.json({
    ok: true,
    license_key: lic.license_key,
    license_tier: lic.license_tier,
    user: publicUser({ ...me, license_key: lic.license_key, license_tier: lic.license_tier }),
  });
}
