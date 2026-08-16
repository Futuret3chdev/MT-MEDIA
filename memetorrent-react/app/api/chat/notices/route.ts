import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';
import { ensureNotices } from '@/lib/chat-notices';

export async function GET() {
  const me = await userBySession(await readSessionToken());
  if (!me) return Response.json({ ok: false, items: [], count: 0 }, { status: 401 });
  const conn = await getUserDb();
  try {
    await ensureNotices(conn);
    try {
      await conn.execute("ALTER TABLE mt_chat_friends ADD COLUMN status VARCHAR(16) NOT NULL DEFAULT 'accepted'");
    } catch {
      /* exists */
    }
    const [notices] = await conn.execute(
      `SELECT id, kind, title, href, from_email, from_username, created_at
       FROM mt_chat_notices
       WHERE to_email = ? AND seen = 0
       ORDER BY id DESC LIMIT 20`,
      [me.email]
    );
    const [incoming] = await conn.execute(
      `SELECT f.id, f.email AS from_email, u.username AS from_username
       FROM mt_chat_friends f
       LEFT JOIN portal_users u ON u.email = f.email
       WHERE f.friend_email = ?
         AND NOT EXISTS (
           SELECT 1 FROM mt_chat_friends m
           WHERE m.email = ? AND m.friend_email = f.email
             AND (m.status = 'accepted' OR m.status IS NULL)
         )`,
      [me.email, me.email]
    );
    let games: { id: number; from_username: string; room: string; title: string; play: string | null }[] = [];
    try {
      const [g] = await conn.execute(
        `SELECT id, from_username, room, title, play
         FROM mt_chat_game_invites
         WHERE to_email = ? AND seen = 0
         ORDER BY id DESC LIMIT 8`,
        [me.email]
      );
      games = g as typeof games;
    } catch {
      games = [];
    }

    const items: {
      id: string;
      kind: string;
      title: string;
      href: string | null;
      from_email: string | null;
      from_username: string | null;
    }[] = [];
    const seenKey = new Set<string>();
    const push = (row: (typeof items)[0]) => {
      const k = `${row.kind}:${row.from_email || row.id}`;
      if (seenKey.has(k)) return;
      seenKey.add(k);
      items.push(row);
    };

    for (const n of notices as {
      id: number;
      kind: string;
      title: string;
      href: string | null;
      from_email: string | null;
      from_username: string | null;
    }[]) {
      push({
        id: `n-${n.id}`,
        kind: n.kind,
        title: n.title,
        href: n.href,
        from_email: n.from_email,
        from_username: n.from_username,
      });
    }
    for (const r of incoming as { id: number; from_email: string; from_username: string }[]) {
      push({
        id: `fr-${r.id}`,
        kind: 'friend_request',
        title: `@${r.from_username || r.from_email} sent a friend request`,
        href: '/chat',
        from_email: r.from_email,
        from_username: r.from_username,
      });
    }
    for (const g of games as { id: number; from_username: string; room: string; title: string; play: string | null }[]) {
      push({
        id: `g-${g.id}`,
        kind: 'game_invite',
        title: `@${g.from_username} wants to play ${g.title}`,
        href: `/chat?room=${encodeURIComponent(g.room)}`,
        from_email: null,
        from_username: g.from_username,
      });
    }

    return Response.json({ ok: true, items, count: items.length });
  } finally {
    await conn.end();
  }
}

export async function POST(request: NextRequest) {
  const me = await userBySession(await readSessionToken());
  if (!me) return Response.json({ ok: false }, { status: 401 });
  let body: { id?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const raw = String(body.id || '');
  const conn = await getUserDb();
  try {
    await ensureNotices(conn);
    if (raw.startsWith('n-')) {
      await conn.execute('UPDATE mt_chat_notices SET seen = 1 WHERE id = ? AND to_email = ?', [
        Number(raw.slice(2)) || 0,
        me.email,
      ]);
    }
    if (raw.startsWith('g-')) {
      await conn.execute('UPDATE mt_chat_game_invites SET seen = 1 WHERE id = ? AND to_email = ?', [
        Number(raw.slice(2)) || 0,
        me.email,
      ]);
    }
    return Response.json({ ok: true });
  } finally {
    await conn.end();
  }
}
