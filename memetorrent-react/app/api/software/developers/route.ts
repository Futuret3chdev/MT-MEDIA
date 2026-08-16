import { NextRequest } from 'next/server';
import { issueFreeLicense } from '@/lib/dev-license';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hits = new Map<string, { n: number; t: number }>();

function limited(ip: string): boolean {
  const now = Date.now();
  const cur = hits.get(ip);
  if (!cur || now - cur.t > 60 * 60 * 1000) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  cur.n += 1;
  return cur.n > 8;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (limited(ip)) {
    return Response.json({ ok: false, error: 'Too many signups from this network. Try later.' }, { status: 429 });
  }
  let body: { name?: string; email?: string; handle?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const name = (body.name || '').trim();
  const email = (body.email || '').trim();
  const handle = (body.handle || '').trim();
  if (name.length < 2) {
    return Response.json({ ok: false, error: 'Name is required.' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return Response.json({ ok: false, error: 'A real email is required.' }, { status: 400 });
  }
  try {
    const { license, created } = await issueFreeLicense({ name, email, handle });
    return Response.json({
      ok: true,
      created,
      license: {
        name: license.name,
        email: license.email,
        handle: license.handle,
        license_key: license.license_key,
        tier: license.tier,
      },
    });
  } catch (err) {
    console.error('dev license', err);
    return Response.json({ ok: false, error: 'Could not issue a license right now.' }, { status: 500 });
  }
}
