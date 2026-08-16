import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';
import { addMember, ensureChat, newInviteCode } from '@/lib/chat-core';

export async function GET(request: NextRequest) {
  const code = String(request.nextUrl.searchParams.get('code') || '').trim();
  if (!code) return Response.json({ ok: false, error: 'Missing invite' }, { status: 400 });
  const conn = await getUserDb();
  try {
    await ensureChat(conn);
    const [rows] = await conn.execute(
      'SELECT slug, name, kind, topic FROM mt_chat_channels WHERE invite_code = ? LIMIT 1',
      [code]
    );
    const ch = (rows as { slug: string; name: string; kind: string; topic: string | null }[])[0];
    if (!ch) return Response.json({ ok: false, error: 'Invite expired or unknown' }, { status: 404 });
    return Response.json({ ok: true, slug: ch.slug, name: ch.name, kind: ch.kind, topic: ch.topic });
  } finally {
    await conn.end();
  }
}

export async function POST(request: NextRequest) {
  const me = await userBySession(await readSessionToken());
  if (!me) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  let body: { room?: string; code?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const conn = await getUserDb();
  try {
    await ensureChat(conn);
    if (body.code) {
      const [rows] = await conn.execute(
        'SELECT slug, name, kind FROM mt_chat_channels WHERE invite_code = ? LIMIT 1',
        [String(body.code).trim()]
      );
      const ch = (rows as { slug: string; name: string; kind: string }[])[0];
      if (!ch) return Response.json({ ok: false, error: 'Invite expired or unknown' }, { status: 404 });
      await addMember(conn, ch.slug, me.email, 'member');
      return Response.json({ ok: true, joined: true, slug: ch.slug, name: ch.name, kind: ch.kind });
    }
    const room = String(body.room || '').slice(0, 48);
    if (!room) return Response.json({ ok: false, error: 'Missing room' }, { status: 400 });
    const [rows] = await conn.execute(
      'SELECT slug, name, owner_email, invite_code, kind FROM mt_chat_channels WHERE slug = ? LIMIT 1',
      [room]
    );
    const ch = (rows as { slug: string; name: string; owner_email: string | null; invite_code: string | null; kind: string }[])[0];
    if (!ch) return Response.json({ ok: false, error: 'Unknown room' }, { status: 404 });
    const owner = String(ch.owner_email || '').toLowerCase();
    if (owner && owner !== me.email.toLowerCase()) {
      return Response.json({ ok: false, error: 'Only the owner can mint an invite' }, { status: 403 });
    }
    let code = ch.invite_code;
    if (!code || body.room) {
      code = newInviteCode();
      await conn.execute('UPDATE mt_chat_channels SET invite_code = ? WHERE slug = ?', [code, room]);
    }
    return Response.json({
      ok: true,
      code,
      path: `/chat?join=${code}`,
      name: ch.name,
    });
  } finally {
    await conn.end();
  }
}
