import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';
import { ensureChat, ensureDmChannel } from '@/lib/chat-core';

async function ensure(conn: Awaited<ReturnType<typeof getUserDb>>) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_chat_friends (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(190) NOT NULL,
      friend_email VARCHAR(190) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY pair (email, friend_email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  try {
    await conn.execute("ALTER TABLE mt_chat_friends ADD COLUMN status VARCHAR(16) NOT NULL DEFAULT 'accepted'");
  } catch {
    /* exists */
  }
}

async function lookupUser(conn: Awaited<ReturnType<typeof getUserDb>>, email: string, username?: string) {
  let addr = String(email || '').trim().toLowerCase();
  let name = String(username || '').trim();
  if (!addr && name) {
    const [found] = await conn.execute('SELECT email, username FROM portal_users WHERE username = ? LIMIT 1', [name]);
    const u = (found as { email: string; username: string }[])[0];
    addr = u?.email?.toLowerCase() || '';
    name = u?.username || name;
  } else if (addr) {
    const [found] = await conn.execute('SELECT username FROM portal_users WHERE email = ? LIMIT 1', [addr]);
    name = String((found as { username: string }[])[0]?.username || name);
  }
  return { email: addr, username: name };
}

export async function GET() {
  const me = await userBySession(await readSessionToken());
  if (!me) return Response.json({ ok: false, friends: [] }, { status: 401 });
  const conn = await getUserDb();
  try {
    await ensure(conn);
    const [friends] = await conn.execute(
      `SELECT f.friend_email, u.username, u.avatar_url, u.wallet_address
       FROM mt_chat_friends f
       LEFT JOIN portal_users u ON u.email = f.friend_email
       WHERE f.email = ? AND (f.status = 'accepted' OR f.status IS NULL)
       ORDER BY f.id DESC`,
      [me.email]
    );
    const [incoming] = await conn.execute(
      `SELECT f.id, f.email AS from_email, u.username AS from_username, u.avatar_url
       FROM mt_chat_friends f
       LEFT JOIN portal_users u ON u.email = f.email
       WHERE f.friend_email = ?
         AND NOT EXISTS (
           SELECT 1 FROM mt_chat_friends m
           WHERE m.email = ? AND m.friend_email = f.email
             AND (m.status = 'accepted' OR m.status IS NULL)
         )
       ORDER BY f.id DESC`,
      [me.email, me.email]
    );
    const [outgoing] = await conn.execute(
      `SELECT f.friend_email, u.username
       FROM mt_chat_friends f
       LEFT JOIN portal_users u ON u.email = f.friend_email
       WHERE f.email = ? AND f.status = 'pending'
       ORDER BY f.id DESC`,
      [me.email]
    );
    return Response.json({ ok: true, friends, incoming, outgoing });
  } finally {
    await conn.end();
  }
}

export async function POST(request: NextRequest) {
  const me = await userBySession(await readSessionToken());
  if (!me) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  let body: { email?: string; username?: string; action?: string } = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const conn = await getUserDb();
  try {
    await ensure(conn);
    await ensureChat(conn);
    const them = await lookupUser(conn, String(body.email || ''), body.username);
    if (!them.email || them.email === me.email.toLowerCase()) {
      return Response.json({ ok: false, error: 'User not found.' }, { status: 400 });
    }
    const action = String(body.action || 'request');

    if (action === 'accept') {
      const [rows] = await conn.execute(
        'SELECT id FROM mt_chat_friends WHERE email = ? AND friend_email = ? LIMIT 1',
        [them.email, me.email]
      );
      if (!(rows as object[]).length) {
        return Response.json({ ok: false, error: 'No request from them' }, { status: 404 });
      }
      await conn.execute("UPDATE mt_chat_friends SET status = 'accepted' WHERE email = ? AND friend_email = ?", [
        them.email,
        me.email,
      ]);
      await conn.execute(
        "INSERT INTO mt_chat_friends (email, friend_email, status) VALUES (?,?, 'accepted') ON DUPLICATE KEY UPDATE status = 'accepted'",
        [me.email, them.email]
      );
      const slug = await ensureDmChannel(conn, me.email, them.email, `@${them.username || 'Direct'}`);
      await conn.execute(
        'INSERT INTO mt_crypto_chat (room, username, body, kind, owner_email) VALUES (?,?,?,?,?)',
        [slug, me.username, `accepted the friend request`, 'text', me.email]
      );
      return Response.json({ ok: true, accepted: true, slug });
    }

    if (action === 'decline') {
      await conn.execute("DELETE FROM mt_chat_friends WHERE email = ? AND friend_email = ? AND status = 'pending'", [
        them.email,
        me.email,
      ]);
      return Response.json({ ok: true, declined: true });
    }

    const [already] = await conn.execute(
      "SELECT status FROM mt_chat_friends WHERE email = ? AND friend_email = ? LIMIT 1",
      [me.email, them.email]
    );
    const cur = (already as { status: string }[])[0];
    if (cur?.status === 'accepted') {
      return Response.json({ ok: true, already: true });
    }
    const [reverse] = await conn.execute(
      "SELECT status FROM mt_chat_friends WHERE email = ? AND friend_email = ? LIMIT 1",
      [them.email, me.email]
    );
    if ((reverse as { status: string }[])[0]?.status === 'pending') {
      await conn.execute("UPDATE mt_chat_friends SET status = 'accepted' WHERE email = ? AND friend_email = ?", [
        them.email,
        me.email,
      ]);
      await conn.execute(
        "INSERT INTO mt_chat_friends (email, friend_email, status) VALUES (?,?, 'accepted') ON DUPLICATE KEY UPDATE status = 'accepted'",
        [me.email, them.email]
      );
      return Response.json({ ok: true, accepted: true });
    }

    await conn.execute(
      "INSERT INTO mt_chat_friends (email, friend_email, status) VALUES (?,?, 'pending') ON DUPLICATE KEY UPDATE status = 'pending'",
      [me.email, them.email]
    );
    const slug = await ensureDmChannel(conn, me.email, them.email, `@${them.username || 'Direct'}`);
    await conn.execute(
      'INSERT INTO mt_crypto_chat (room, username, body, kind, owner_email) VALUES (?,?,?,?,?)',
      [slug, me.username, `sent you a friend request`, 'friend', me.email]
    );
    return Response.json({ ok: true, requested: true, slug, username: them.username });
  } catch (err) {
    console.error('friends', err);
    return Response.json({ ok: false, error: 'Could not send friend request' }, { status: 500 });
  } finally {
    await conn.end();
  }
}

export async function DELETE(request: NextRequest) {
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
    await ensure(conn);
    const them = await lookupUser(conn, String(body.email || ''), body.username);
    if (!them.email) return Response.json({ ok: false, error: 'User not found.' }, { status: 400 });
    await conn.execute('DELETE FROM mt_chat_friends WHERE email = ? AND friend_email = ?', [me.email, them.email]);
    await conn.execute('DELETE FROM mt_chat_friends WHERE email = ? AND friend_email = ?', [them.email, me.email]);
    return Response.json({ ok: true });
  } finally {
    await conn.end();
  }
}
