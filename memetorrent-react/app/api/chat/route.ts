import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';
import { canAccessRoom, ensureChat, roomRole } from '@/lib/chat-core';
import { blockedReason } from '@/lib/chat-moderation';

export async function GET(request: NextRequest) {
  const room = request.nextUrl.searchParams.get('room') || 'trades';
  const conn = await getUserDb();
  try {
    await ensureChat(conn);
    const me = await userBySession(await readSessionToken());
    if (!(await canAccessRoom(conn, room, me?.email))) {
      return Response.json({ ok: false, error: 'This room is private.', messages: [] }, { status: 403 });
    }
    await conn.execute('DELETE FROM mt_crypto_chat WHERE burn_at IS NOT NULL AND burn_at < NOW()');
    let rows: object[] = [];
    try {
      const [joined] = await conn.execute(
        `SELECT m.id, m.room, m.username, m.body, m.burn_at, m.no_forward, m.kind, m.owner_email, m.created_at,
                m.reply_to, m.forwarded_from, u.avatar_url,
                r.username AS reply_username, r.body AS reply_body, r.kind AS reply_kind
         FROM mt_crypto_chat m
         LEFT JOIN portal_users u ON u.email = m.owner_email
         LEFT JOIN mt_crypto_chat r ON r.id = m.reply_to
         WHERE m.room = ?
         ORDER BY m.id DESC LIMIT 100`,
        [room]
      );
      rows = joined as object[];
    } catch {
      const [plain] = await conn.execute(
        `SELECT m.id, m.room, m.username, m.body, m.burn_at, m.no_forward, m.kind, m.owner_email, m.created_at,
                u.avatar_url
         FROM mt_crypto_chat m
         LEFT JOIN portal_users u ON u.email = m.owner_email
         WHERE m.room = ?
         ORDER BY m.id DESC LIMIT 100`,
        [room]
      );
      rows = plain as object[];
    }
    const [ch] = await conn.execute(
      `SELECT slug, name, kind, owner_email, topic, background, music_url, show_chart, collab_note, media_playing, media_started, game_id, game_state
       FROM mt_chat_channels WHERE slug = ? LIMIT 1`,
      [room]
    );
    const channel = (ch as Record<string, unknown>[])[0] || null;
    const my_role = me ? await roomRole(conn, room, me.email) : null;
    return Response.json({
      ok: true,
      room,
      messages: rows.reverse(),
      channel: channel
        ? {
            ...channel,
            show_chart: Number(channel.show_chart) === 1,
            media_playing: Number(channel.media_playing) === 1,
            my_role,
          }
        : null,
    });
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
  let body: {
    room?: string;
    text?: string;
    burn?: number;
    no_forward?: boolean;
    persona?: string;
    kind?: string;
    reply_to?: number;
    forwarded_from?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const room = String(body.room || 'trades').slice(0, 48);
  const text = (body.text || '').trim().slice(0, 800);
  if (!text) return Response.json({ ok: false, error: 'Message required.' }, { status: 400 });
  const blocked = blockedReason(text);
  if (blocked) return Response.json({ ok: false, error: blocked }, { status: 400 });
  const stealth = body.persona === 'stealth';
  const username = stealth
    ? '0xStealth' + String(user.id).slice(-4)
    : user.username;
  const burn = Number(body.burn) || 0;
  const conn = await getUserDb();
  try {
    await ensureChat(conn);
    const [ch] = await conn.execute('SELECT slug, kind FROM mt_chat_channels WHERE slug = ? LIMIT 1', [room]);
    const channel = (ch as { slug: string; kind: string }[])[0];
    if (!channel) {
      return Response.json({ ok: false, error: 'Unknown channel.' }, { status: 404 });
    }
    if (!(await canAccessRoom(conn, room, user.email))) {
      return Response.json({ ok: false, error: 'This room is private.' }, { status: 403 });
    }
    let kind = String(body.kind || 'text');
    if (
      ![
        'text',
        'asset',
        'sticker',
        'trade',
        'event',
        'image',
        'nft',
        'audio',
        'video',
        'file',
        'game',
        'friend',
        'score',
        'match',
        'fun',
        'react',
      ].includes(kind)
    ) {
      kind = 'text';
    }
    if (kind === 'text' && (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(text) || /^\$[A-Za-z0-9]+$/.test(text))) {
      kind = 'asset';
    }
    const replyTo = Number(body.reply_to) || null;
    const forwarded = String(body.forwarded_from || '').slice(0, 80) || null;
    try {
      await conn.execute(
        `INSERT INTO mt_crypto_chat (room, username, body, burn_at, no_forward, kind, owner_email, reply_to, forwarded_from)
         VALUES (?,?,?,${burn > 0 ? 'DATE_ADD(NOW(), INTERVAL ? SECOND)' : 'NULL'},?,?,?,?,?)`,
        burn > 0
          ? [room, username, text, burn, body.no_forward ? 1 : 0, kind, user.email, replyTo, forwarded]
          : [room, username, text, body.no_forward ? 1 : 0, kind, user.email, replyTo, forwarded]
      );
    } catch {
      await conn.execute(
        `INSERT INTO mt_crypto_chat (room, username, body, burn_at, no_forward, kind, owner_email)
         VALUES (?,?,?,${burn > 0 ? 'DATE_ADD(NOW(), INTERVAL ? SECOND)' : 'NULL'},?,?,?)`,
        burn > 0
          ? [room, username, text, burn, body.no_forward ? 1 : 0, kind, user.email]
          : [room, username, text, body.no_forward ? 1 : 0, kind, user.email]
      );
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error('chat post', err);
    return Response.json({ ok: false, error: 'Could not send.' }, { status: 500 });
  } finally {
    await conn.end();
  }
}

export async function DELETE(request: NextRequest) {
  const user = await userBySession(await readSessionToken());
  if (!user) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return Response.json({ ok: false, error: 'Missing id' }, { status: 400 });
  const conn = await getUserDb();
  try {
    await ensureChat(conn);
    await conn.execute(
      'DELETE FROM mt_crypto_chat WHERE id = ? AND owner_email = ?',
      [id, user.email]
    );
    return Response.json({ ok: true });
  } catch (err) {
    console.error('chat del', err);
    return Response.json({ ok: false, error: 'Could not delete' }, { status: 500 });
  } finally {
    await conn.end();
  }
}
