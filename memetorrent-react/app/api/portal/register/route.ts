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
    const [result] = await conn.execute(
      'INSERT INTO portal_users (username, email, password_hash, session_token, created_at, last_login, is_admin) VALUES (?,?,?,?,NOW(),NOW(),0)',
      [username, email, hash, token]
    );
    const id = Number((result as { insertId?: number }).insertId || 0);
    const lic = await attachLicense(conn, { id, username, email });
    await writeSessionCookie(token);
    const user: PortalUser = {
      id,
      username,
      email,
      wallet_address: null,
      license_key: lic.license_key,
      license_tier: lic.license_tier,
    };
    return Response.json({ ok: true, created: true, user: publicUser(user) });
  } catch (err) {
    console.error('portal register', err);
    return Response.json({ ok: false, error: 'Could not create the account.' }, { status: 500 });
  } finally {
    await conn.end();
  }
}
