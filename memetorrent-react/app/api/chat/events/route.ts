import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';
import { ensureChat } from '@/lib/chat-core';

export async function GET(request: NextRequest) {
  const room = request.nextUrl.searchParams.get('room') || 'trades';
  const conn = await getUserDb();
  try {
    await ensureChat(conn);
    const [rows] = await conn.execute(
      'SELECT id, room, event_name, payload, created_at FROM mt_chat_events WHERE room = ? ORDER BY id DESC LIMIT 20',
      [room]
    );
    return Response.json({ ok: true, events: (rows as object[]).reverse() });
  } finally {
    await conn.end();
  }
}

export async function POST(request: NextRequest) {
  const user = await userBySession(await readSessionToken());
  if (!user) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  let body: { room?: string; event?: string; payload?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const room = String(body.room || 'trades').slice(0, 48);
  const event = String(body.event || 'MatchWon').slice(0, 64);
  const conn = await getUserDb();
  try {
    await ensureChat(conn);
    await conn.execute('INSERT INTO mt_chat_events (room, event_name, payload) VALUES (?,?,?)', [
      room,
      event,
      JSON.stringify(body.payload || { by: user.username }).slice(0, 2000),
    ]);
    await conn.execute(
      'INSERT INTO mt_crypto_chat (room, username, body, kind) VALUES (?,?,?,?)',
      [room, 'sdk', `${event} · ${user.username}`, 'event']
    );
    return Response.json({ ok: true });
  } catch (err) {
    console.error('chat event', err);
    return Response.json({ ok: false, error: 'Could not post event' }, { status: 500 });
  } finally {
    await conn.end();
  }
}
