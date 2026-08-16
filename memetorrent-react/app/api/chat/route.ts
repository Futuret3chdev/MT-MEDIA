import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';

const ROOMS = ['trades', 'signals', 'otc', 'general', 'support'] as const;

async function ensure(conn: Awaited<ReturnType<typeof getUserDb>>) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_crypto_chat (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      room VARCHAR(32) NOT NULL,
      username VARCHAR(255) NOT NULL,
      body VARCHAR(500) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY room_time (room, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export async function GET(request: NextRequest) {
  const room = request.nextUrl.searchParams.get('room') || 'trades';
  if (!ROOMS.includes(room as (typeof ROOMS)[number])) {
    return Response.json({ ok: false, error: 'Unknown room' }, { status: 400 });
  }
  const conn = await getUserDb();
  try {
    await ensure(conn);
    const [rows] = await conn.execute(
      'SELECT id, room, username, body, created_at FROM mt_crypto_chat WHERE room = ? ORDER BY id DESC LIMIT 80',
      [room]
    );
    return Response.json({ ok: true, room, messages: (rows as object[]).reverse() });
  } catch (err) {
    console.error('chat get', err);
    return Response.json({ ok: false, error: 'Chat unavailable.' }, { status: 500 });
  } finally {
    await conn.end();
  }
}

export async function POST(request: NextRequest) {
  const user = await userBySession(await readSessionToken());
  if (!user) return Response.json({ ok: false, error: 'Sign in to chat.' }, { status: 401 });
  let body: { room?: string; text?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const room = body.room || 'trades';
  const text = (body.text || '').trim().slice(0, 500);
  if (!ROOMS.includes(room as (typeof ROOMS)[number]) || !text) {
    return Response.json({ ok: false, error: 'Need a room and a message.' }, { status: 400 });
  }
  const conn = await getUserDb();
  try {
    await ensure(conn);
    await conn.execute('INSERT INTO mt_crypto_chat (room, username, body) VALUES (?,?,?)', [
      room,
      user.username,
      text,
    ]);
    return Response.json({ ok: true });
  } catch (err) {
    console.error('chat post', err);
    return Response.json({ ok: false, error: 'Could not send.' }, { status: 500 });
  } finally {
    await conn.end();
  }
}
