import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';

async function ensure(conn: Awaited<ReturnType<typeof getUserDb>>) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_chat_friends (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(190) NOT NULL,
      friend_email VARCHAR(190) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY pair (email, friend_email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export async function GET() {
  const me = await userBySession(await readSessionToken());
  if (!me) return Response.json({ ok: false, friends: [] }, { status: 401 });
  const conn = await getUserDb();
  try {
    await ensure(conn);
    const [rows] = await conn.execute(
      `SELECT f.friend_email, u.username, u.avatar_url, u.wallet_address
       FROM mt_chat_friends f
       LEFT JOIN portal_users u ON u.email = f.friend_email
       WHERE f.email = ?
       ORDER BY f.id DESC`,
      [me.email]
    );
    return Response.json({ ok: true, friends: rows });
  } finally {
    await conn.end();
  }
}

export async function POST(request: NextRequest) {
  const me = await userBySession(await readSessionToken());
  if (!me) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  let body: { email?: string; username?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const conn = await getUserDb();
  try {
    await ensure(conn);
    let email = String(body.email || '').trim().toLowerCase();
    if (!email && body.username) {
      const [found] = await conn.execute(
        'SELECT email FROM portal_users WHERE username = ? LIMIT 1',
        [String(body.username)]
      );
      email = String((found as { email: string }[])[0]?.email || '');
    }
    if (!email || email === me.email) {
      return Response.json({ ok: false, error: 'User not found.' }, { status: 400 });
    }
    await conn.execute(
      'INSERT IGNORE INTO mt_chat_friends (email, friend_email) VALUES (?,?)',
      [me.email, email]
    );
    return Response.json({ ok: true });
  } catch (err) {
    console.error('friends', err);
    return Response.json({ ok: false, error: 'Could not add friend' }, { status: 500 });
  } finally {
    await conn.end();
  }
}

export async function DELETE(request: NextRequest) {
  const me = await userBySession(await readSessionToken());
  if (!me) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  let body: { email?: string; username?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const conn = await getUserDb();
  try {
    await ensure(conn);
    let email = String(body.email || '').trim().toLowerCase();
    if (!email && body.username) {
      const [found] = await conn.execute(
        'SELECT email FROM portal_users WHERE username = ? LIMIT 1',
        [String(body.username)]
      );
      email = String((found as { email: string }[])[0]?.email || '');
    }
    if (!email) return Response.json({ ok: false, error: 'User not found.' }, { status: 400 });
    await conn.execute('DELETE FROM mt_chat_friends WHERE email = ? AND friend_email = ?', [me.email, email]);
    return Response.json({ ok: true });
  } finally {
    await conn.end();
  }
}
