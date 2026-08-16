import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import {
  attachLicense,
  hashPassword,
  newSessionToken,
  publicUser,
  writeSessionCookie,
  type PortalUser,
} from '@/lib/portal-auth';

export async function POST(request: NextRequest) {
  let body: { username?: string; email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const username = (body.username || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  if (username.length < 3) {
    return Response.json({ ok: false, error: 'Username must be at least 3 characters.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ ok: false, error: 'A real email is required.' }, { status: 400 });
  }
  if (password.length < 6) {
    return Response.json({ ok: false, error: 'Password must be at least 6 characters.' }, { status: 400 });
  }

  const conn = await getUserDb();
  try {
    const [dup] = await conn.execute(
      'SELECT id FROM portal_users WHERE email = ? OR username = ? LIMIT 1',
      [email, username]
    );
    if ((dup as { id: number }[])[0]) {
      return Response.json({ ok: false, error: 'Email or username already registered. Log in instead.' }, { status: 409 });
    }
    const hash = await hashPassword(password);
    const token = newSessionToken();
    await conn.execute(
      'INSERT INTO portal_users (username, email, password_hash, session_token, created_at, last_login, is_admin) VALUES (?,?,?,?,NOW(),NOW(),0)',
      [username, email, hash, token]
    );
    const [createdRows] = await conn.execute(
      'SELECT id, username, email, wallet_address, license_key, license_tier FROM portal_users WHERE email = ? LIMIT 1',
      [email]
    );
    const created = (createdRows as PortalUser[])[0];
    if (!created) {
      return Response.json({ ok: false, error: 'Account insert did not return a profile.' }, { status: 500 });
    }
    let lic = { license_key: created.license_key || '', license_tier: created.license_tier || 'free' };
    try {
      lic = await attachLicense(conn, {
        id: created.id,
        username: created.username,
        email: created.email,
      });
    } catch (licErr) {
      console.error('portal register license', licErr);
    }
    created.license_key = lic.license_key || created.license_key;
    created.license_tier = lic.license_tier || created.license_tier;
    await writeSessionCookie(token);
    return Response.json({ ok: true, created: true, user: publicUser(created) });
  } catch (err) {
    console.error('portal register', err);
    const detail = err instanceof Error ? err.message : 'unknown';
    return Response.json({ ok: false, error: `Could not create the account. ${detail}` }, { status: 500 });
  } finally {
    await conn.end();
  }
}
