import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';
import { ensureChat } from '@/lib/chat-core';

export async function GET(request: NextRequest) {
  const me = await userBySession(await readSessionToken());
  if (!me) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  const since = Number(request.nextUrl.searchParams.get('since') || '0') || 0;
  const conn = await getUserDb();
  try {
    await ensureChat(conn);
    await conn.execute('DELETE FROM mt_chat_signals WHERE created_at < DATE_SUB(NOW(), INTERVAL 2 HOUR)');
    const [rows] = await conn.execute(
      `SELECT s.id, s.room, s.from_email, s.to_email, s.kind, s.payload, s.created_at, u.username AS from_username
       FROM mt_chat_signals s
       LEFT JOIN portal_users u ON u.email = s.from_email
       WHERE s.id > ? AND (s.to_email = ? OR s.from_email = ?)
         AND s.created_at > DATE_SUB(NOW(), INTERVAL 90 SECOND)
       ORDER BY s.id ASC LIMIT 80`,
      [since, me.email, me.email]
    );
    return Response.json({ ok: true, me: me.email, signals: rows });
  } finally {
    await conn.end();
  }
}

export async function POST(request: NextRequest) {
  const me = await userBySession(await readSessionToken());
  if (!me) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  let body: { to?: string; kind?: string; payload?: unknown; room?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const kind = String(body.kind || '').slice(0, 24);
  if (!['invite', 'offer', 'answer', 'ice', 'hangup', 'reject'].includes(kind)) {
    return Response.json({ ok: false, error: 'Bad signal' }, { status: 400 });
  }
  const conn = await getUserDb();
  try {
    await ensureChat(conn);
    let to = String(body.to || '').trim().toLowerCase();
    if (to && !to.includes('@')) {
      const [found] = await conn.execute('SELECT email FROM portal_users WHERE username = ? LIMIT 1', [to]);
      to = String((found as { email: string }[])[0]?.email || '').toLowerCase();
    }
    if (!to) return Response.json({ ok: false, error: 'Who are you calling?' }, { status: 400 });
    if (to === me.email.toLowerCase()) {
      return Response.json({ ok: false, error: 'Cannot call yourself' }, { status: 400 });
    }
    const payload = JSON.stringify(body.payload ?? {}).slice(0, 20000);
    await conn.execute(
      'INSERT INTO mt_chat_signals (room, from_email, to_email, kind, payload) VALUES (?,?,?,?,?)',
      [String(body.room || '').slice(0, 48) || null, me.email, to, kind, payload]
    );
    return Response.json({ ok: true });
  } finally {
    await conn.end();
  }
}
