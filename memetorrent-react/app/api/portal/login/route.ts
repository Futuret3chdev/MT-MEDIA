import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import {
  attachLicense,
  checkPassword,
  ensurePortalColumns,
  newSessionToken,
  publicUser,
  writeSessionCookie,
  type PortalUser,
} from '@/lib/portal-auth';

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  if (!email || !password) {
    return Response.json({ ok: false, error: 'Email and password are required.' }, { status: 400 });
  }

  const conn = await getUserDb();
  try {
    await ensurePortalColumns(conn);
    const [rows] = await conn.execute(
      'SELECT id, username, email, password_hash, wallet_address, license_key, license_tier FROM portal_users WHERE email = ? LIMIT 1',
      [email]
    );
    const row = (rows as (PortalUser & { password_hash: string })[])[0];
    if (!row || !(await checkPassword(password, row.password_hash))) {
      return Response.json({ ok: false, error: 'Invalid email or password.' }, { status: 401 });
    }
    const token = newSessionToken();
    await conn.execute('UPDATE portal_users SET session_token = ?, last_login = NOW() WHERE email = ?', [
      token,
      email,
    ]);
    try {
      const lic = await attachLicense(conn, row);
      row.license_key = lic.license_key;
      row.license_tier = lic.license_tier;
    } catch (licErr) {
      console.error('portal login license', licErr);
    }
    await writeSessionCookie(token);
    return Response.json({ ok: true, user: publicUser(row) });
  } catch (err) {
    console.error('portal login', err);
    const detail = err instanceof Error ? err.message : 'unknown';
    return Response.json({ ok: false, error: `Could not log in right now. ${detail}` }, { status: 500 });
  } finally {
    await conn.end();
  }
}
