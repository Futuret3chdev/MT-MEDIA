import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';
import { ensureChat, ensureDmChannel } from '@/lib/chat-core';

export async function POST(request: NextRequest) {
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
    await ensureChat(conn);
    let email = String(body.email || '').trim().toLowerCase();
    let username = String(body.username || '').trim();
    if (!email && username) {
      const [found] = await conn.execute(
        'SELECT email, username, avatar_url FROM portal_users WHERE username = ? LIMIT 1',
        [username]
      );
      const u = (found as { email: string; username: string; avatar_url: string | null }[])[0];
      if (u) {
        email = u.email.toLowerCase();
        username = u.username;
      }
    }
    if (!email || email === me.email.toLowerCase()) {
      return Response.json({ ok: false, error: 'Pick someone else to message.' }, { status: 400 });
    }
    const [found] = await conn.execute(
      'SELECT email, username, avatar_url FROM portal_users WHERE email = ? LIMIT 1',
      [email]
    );
    const other = (found as { email: string; username: string; avatar_url: string | null }[])[0];
    if (!other) return Response.json({ ok: false, error: 'User not found.' }, { status: 404 });
    const slug = await ensureDmChannel(conn, me.email, other.email, `@${other.username}`);
    return Response.json({
      ok: true,
      slug,
      with: { username: other.username, email: other.email, avatar_url: other.avatar_url },
    });
  } finally {
    await conn.end();
  }
}
