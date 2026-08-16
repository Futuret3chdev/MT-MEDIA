import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';
import { addMember, ensureChat, ensurePersonalVault, isPrivateKind, slugifyChannel, SYSTEM_ROOMS } from '@/lib/chat-core';

const EXTRAS =
  'slug, name, kind, gate_note, owner_email, invite_code, background, music_url, show_chart, collab_note, topic';

export async function GET() {
  const me = await userBySession(await readSessionToken());
  const conn = await getUserDb();
  try {
    await ensureChat(conn);
    if (me) await ensurePersonalVault(conn, me.email, me.username);
    const [rows] = await conn.execute(
      `SELECT ${EXTRAS} FROM mt_chat_channels WHERE kind != 'dm' ORDER BY id ASC`
    );
    const all = rows as Record<string, unknown>[];
    const email = me?.email?.toLowerCase() || '';
    let memberSlugs = new Set<string>();
    if (email) {
      const [mem] = await conn.execute('SELECT slug FROM mt_chat_members WHERE email = ?', [email]);
      memberSlugs = new Set((mem as { slug: string }[]).map((m) => m.slug));
    }
    const channels = all
      .filter((c) => {
        const kind = String(c.kind || 'public');
        if (!isPrivateKind(kind)) return true;
        if (!email) return false;
        return (
          String(c.owner_email || '').toLowerCase() === email || memberSlugs.has(String(c.slug))
        );
      })
      .map((c) => ({
        ...c,
        invite_code: String(c.owner_email || '').toLowerCase() === email ? c.invite_code : undefined,
        show_chart: Number(c.show_chart) === 1,
      }));
    return Response.json({ ok: true, channels });
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
  const rawKind = String(body.kind || 'public');
  const kind = rawKind === 'private' || rawKind === 'secret' ? rawKind : 'public';
  if (name.length < 2) return Response.json({ ok: false, error: 'Channel name required.' }, { status: 400 });
  const slug = slugifyChannel(name) + '-' + Date.now().toString(36).slice(-3);
  const conn = await getUserDb();
  try {
    await ensureChat(conn);
    await conn.execute(
      'INSERT INTO mt_chat_channels (slug, name, kind, owner_email, gate_note) VALUES (?,?,?,?,?)',
      [slug, name.replace(/^#/, ''), kind, user.email, String(body.gate || '').slice(0, 160) || null]
    );
    await addMember(conn, slug, user.email, 'owner');
    return Response.json({ ok: true, slug, name: name.replace(/^#/, ''), kind });
  } catch (err) {
    console.error('channels post', err);
    return Response.json({ ok: false, error: 'Could not create channel.' }, { status: 500 });
  } finally {
    await conn.end();
  }
}

export async function PATCH(request: NextRequest) {
  const user = await userBySession(await readSessionToken());
  if (!user) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  let body: {
    slug?: string;
    name?: string;
    kind?: string;
    topic?: string;
    background?: string;
    music_url?: string;
    show_chart?: boolean;
    collab_note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const slug = String(body.slug || '').slice(0, 48);
  if (!slug) return Response.json({ ok: false, error: 'Missing room' }, { status: 400 });
  const conn = await getUserDb();
  try {
    await ensureChat(conn);
    const [rows] = await conn.execute(
      `SELECT ${EXTRAS} FROM mt_chat_channels WHERE slug = ? LIMIT 1`,
      [slug]
    );
    const ch = (rows as Record<string, string | number | null>[])[0];
    if (!ch) return Response.json({ ok: false, error: 'Unknown channel' }, { status: 404 });
    const owner = String(ch.owner_email || '').toLowerCase();
    const me = user.email.toLowerCase();
    const isOwner = owner === me;
    const [mem] = await conn.execute('SELECT email FROM mt_chat_members WHERE slug = ? AND email = ?', [
      slug,
      me,
    ]);
    const isMember = (mem as object[]).length > 0 || isOwner || ch.kind === 'dm';
    if (ch.kind === 'dm') {
      const { dmParticipant } = await import('@/lib/chat-core');
      if (!(await dmParticipant(conn, slug, me))) {
        return Response.json({ ok: false, error: 'Private chat' }, { status: 403 });
      }
    } else if (!isMember && isPrivateKind(String(ch.kind))) {
      return Response.json({ ok: false, error: 'Not in this room' }, { status: 403 });
    }

    const sets: string[] = [];
    const vals: Array<string | number | null> = [];
    if (isOwner || !owner) {
      if (typeof body.name === 'string' && body.name.trim().length >= 2) {
        sets.push('name = ?');
        vals.push(body.name.trim().replace(/^#/, '').slice(0, 80));
      }
      if (
        body.kind &&
        ['public', 'private', 'secret', 'gated'].includes(body.kind) &&
        String(ch.kind) !== 'dm' &&
        String(ch.kind) !== 'vault'
      ) {
        sets.push('kind = ?');
        vals.push(body.kind === 'secret' ? 'private' : body.kind);
      }
    }
    if (typeof body.topic === 'string') {
      sets.push('topic = ?');
      vals.push(body.topic.trim().slice(0, 200) || null);
    }
    if (typeof body.background === 'string') {
      sets.push('background = ?');
      vals.push(body.background.trim().slice(0, 240) || null);
    }
    if (typeof body.music_url === 'string') {
      sets.push('music_url = ?');
      vals.push(body.music_url.trim().slice(0, 400) || null);
    }
    if (typeof body.show_chart === 'boolean') {
      sets.push('show_chart = ?');
      vals.push(body.show_chart ? 1 : 0);
    }
    if (typeof body.collab_note === 'string') {
      sets.push('collab_note = ?');
      vals.push(body.collab_note.slice(0, 20000));
    }
    if (!sets.length) return Response.json({ ok: false, error: 'Nothing to update' }, { status: 400 });
    vals.push(slug);
    await conn.execute(`UPDATE mt_chat_channels SET ${sets.join(', ')} WHERE slug = ?`, vals);
    const [fresh] = await conn.execute(`SELECT ${EXTRAS} FROM mt_chat_channels WHERE slug = ? LIMIT 1`, [slug]);
    const next = (fresh as Record<string, unknown>[])[0];
    return Response.json({
      ok: true,
      channel: { ...next, show_chart: Number(next.show_chart) === 1 },
    });
  } catch (err) {
    console.error('channels patch', err);
    return Response.json({ ok: false, error: 'Could not update' }, { status: 500 });
  } finally {
    await conn.end();
  }
}

export async function DELETE(request: NextRequest) {
  const user = await userBySession(await readSessionToken());
  if (!user) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  const slug = String(request.nextUrl.searchParams.get('slug') || '').slice(0, 48);
  if (!slug) return Response.json({ ok: false, error: 'Missing room' }, { status: 400 });
  if (SYSTEM_ROOMS.some((r) => r.slug === slug) || slug.startsWith('vault-')) {
    return Response.json({ ok: false, error: 'That room cannot be cancelled.' }, { status: 400 });
  }
  const conn = await getUserDb();
  try {
    await ensureChat(conn);
    const [rows] = await conn.execute(
      'SELECT kind, owner_email FROM mt_chat_channels WHERE slug = ? LIMIT 1',
      [slug]
    );
    const ch = (rows as { kind: string; owner_email: string | null }[])[0];
    if (!ch) return Response.json({ ok: false, error: 'Unknown room' }, { status: 404 });
    if (ch.kind === 'dm' || ch.kind === 'vault') {
      return Response.json({ ok: false, error: 'That room cannot be cancelled.' }, { status: 400 });
    }
    if (String(ch.owner_email || '').toLowerCase() !== user.email.toLowerCase()) {
      return Response.json({ ok: false, error: 'Only the owner can cancel this room.' }, { status: 403 });
    }
    await conn.execute('DELETE FROM mt_crypto_chat WHERE room = ?', [slug]);
    await conn.execute('DELETE FROM mt_chat_events WHERE room = ?', [slug]);
    await conn.execute('DELETE FROM mt_chat_members WHERE slug = ?', [slug]);
    await conn.execute('DELETE FROM mt_chat_channels WHERE slug = ?', [slug]);
    return Response.json({ ok: true });
  } catch (err) {
    console.error('channels delete', err);
    return Response.json({ ok: false, error: 'Could not cancel room' }, { status: 500 });
  } finally {
    await conn.end();
  }
}
