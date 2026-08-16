import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';
import { ensureChat, slugifyChannel } from '@/lib/chat-core';

export async function GET() {
  const conn = await getUserDb();
  try {
    await ensureChat(conn);
    const [rows] = await conn.execute(
      "SELECT slug, name, kind, gate_note, owner_email FROM mt_chat_channels WHERE kind != 'dm' ORDER BY id ASC"
    );
    return Response.json({ ok: true, channels: rows });
  } catch (err) {
    console.error('channels get', err);
    return Response.json({ ok: false, channels: [], error: 'Unavailable' }, { status: 500 });
  } finally {
    await conn.end();
  }
}

export async function POST(request: NextRequest) {
  const user = await userBySession(await readSessionToken());
  if (!user) return Response.json({ ok: false, error: 'Sign in to create a channel.' }, { status: 401 });
  let body: { name?: string; kind?: string; gate?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const name = String(body.name || '').trim().slice(0, 80);
  const kind = ['public', 'gated', 'secret'].includes(String(body.kind)) ? String(body.kind) : 'public';
  if (name.length < 2) return Response.json({ ok: false, error: 'Channel name required.' }, { status: 400 });
  const slug = slugifyChannel(name) + '-' + Date.now().toString(36).slice(-3);
  const conn = await getUserDb();
  try {
    await ensureChat(conn);
    await conn.execute(
      'INSERT INTO mt_chat_channels (slug, name, kind, owner_email, gate_note) VALUES (?,?,?,?,?)',
      [slug, name.replace(/^#/, ''), kind, user.email, String(body.gate || '').slice(0, 160) || null]
    );
    return Response.json({ ok: true, slug, name: name.replace(/^#/, ''), kind });
  } catch (err) {
    console.error('channels post', err);
    return Response.json({ ok: false, error: 'Could not create channel.' }, { status: 500 });
  } finally {
    await conn.end();
  }
}
