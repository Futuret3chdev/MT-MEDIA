import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';
import { ensureChat } from '@/lib/chat-core';

export async function GET(request: NextRequest) {
  const room = request.nextUrl.searchParams.get('room') || 'trades';
  const conn = await getUserDb();
  try {
    await ensureChat(conn);
    await conn.execute('DELETE FROM mt_crypto_chat WHERE burn_at IS NOT NULL AND burn_at < NOW()');
    const [rows] = await conn.execute(
      'SELECT id, room, username, body, burn_at, no_forward, kind, created_at FROM mt_crypto_chat WHERE room = ? ORDER BY id DESC LIMIT 100',
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
  let body: { room?: string; text?: string; burn?: number; no_forward?: boolean; persona?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const room = String(body.room || 'trades').slice(0, 48);
  const text = (body.text || '').trim().slice(0, 800);
  if (!text) return Response.json({ ok: false, error: 'Message required.' }, { status: 400 });
  const stealth = body.persona === 'stealth';
  const username = stealth
    ? '0xStealth' + String(user.id).slice(-4)
    : user.username;
  const burn = Number(body.burn) || 0;
  const conn = await getUserDb();
  try {
    await ensureChat(conn);
    const [ch] = await conn.execute('SELECT slug FROM mt_chat_channels WHERE slug = ? LIMIT 1', [room]);
    if (!(ch as object[]).length) {
      return Response.json({ ok: false, error: 'Unknown channel.' }, { status: 404 });
    }
    const kind = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(text) || text.startsWith('$') ? 'asset' : 'text';
    await conn.execute(
      `INSERT INTO mt_crypto_chat (room, username, body, burn_at, no_forward, kind)
       VALUES (?,?,?,${burn > 0 ? 'DATE_ADD(NOW(), INTERVAL ? SECOND)' : 'NULL'},?,?)`,
      burn > 0
        ? [room, username, text, burn, body.no_forward ? 1 : 0, kind]
        : [room, username, text, body.no_forward ? 1 : 0, kind]
    );
    return Response.json({ ok: true });
  } catch (err) {
    console.error('chat post', err);
    return Response.json({ ok: false, error: 'Could not send.' }, { status: 500 });
  } finally {
    await conn.end();
  }
}
