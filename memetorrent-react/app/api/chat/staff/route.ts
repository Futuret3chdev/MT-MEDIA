import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';
import { addMember, canOwnRoom, ensureChat, roomRole } from '@/lib/chat-core';

export async function GET(request: NextRequest) {
  const me = await userBySession(await readSessionToken());
  if (!me) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  const slug = String(request.nextUrl.searchParams.get('room') || '').slice(0, 48);
  if (!slug) return Response.json({ ok: false, error: 'Missing room' }, { status: 400 });
  const conn = await getUserDb();
  try {
    await ensureChat(conn);
    const role = await roomRole(conn, slug, me.email);
    if (!role) return Response.json({ ok: false, error: 'Not in this room' }, { status: 403 });
    const [rows] = await conn.execute(
      `SELECT m.email, m.role, u.username
       FROM mt_chat_members m
       LEFT JOIN portal_users u ON u.email = m.email
       WHERE m.slug = ? AND m.role IN ('owner','admin','mod')
       ORDER BY FIELD(m.role,'owner','admin','mod'), m.email`,
      [slug]
    );
    return Response.json({ ok: true, role, staff: rows });
  } finally {
    await conn.end();
  }
}

export async function POST(request: NextRequest) {
  const me = await userBySession(await readSessionToken());
  if (!me) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  let body: { room?: string; username?: string; email?: string; role?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const slug = String(body.room || '').slice(0, 48);
  const nextRole = body.role === 'admin' || body.role === 'mod' ? body.role : '';
  if (!slug || !nextRole) {
    return Response.json({ ok: false, error: 'Room and role (admin or mod) required' }, { status: 400 });
  }
  const conn = await getUserDb();
  try {
    await ensureChat(conn);
    const mine = await roomRole(conn, slug, me.email);
    if (nextRole === 'admin' && !canOwnRoom(mine)) {
      return Response.json({ ok: false, error: 'Only the host can add admins' }, { status: 403 });
    }
    if (nextRole === 'mod' && mine !== 'owner' && mine !== 'admin') {
      return Response.json({ ok: false, error: 'Only the host or an admin can add mods' }, { status: 403 });
    }
    let email = String(body.email || '').trim().toLowerCase();
    let username = String(body.username || '').trim();
    if (!email && username) {
      const [found] = await conn.execute(
        'SELECT email, username FROM portal_users WHERE username = ? LIMIT 1',
        [username]
      );
      const u = (found as { email: string; username: string }[])[0];
      if (u) {
        email = u.email.toLowerCase();
        username = u.username;
      }
    }
    if (!email) return Response.json({ ok: false, error: 'User not found' }, { status: 404 });
    if (email === me.email.toLowerCase()) {
      return Response.json({ ok: false, error: 'You already manage this room' }, { status: 400 });
    }
    const theirs = await roomRole(conn, slug, email);
    if (theirs === 'owner') {
      return Response.json({ ok: false, error: 'Cannot change the host' }, { status: 400 });
    }
    await addMember(conn, slug, email, nextRole);
    return Response.json({ ok: true, email, username, role: nextRole });
  } finally {
    await conn.end();
  }
}

export async function DELETE(request: NextRequest) {
  const me = await userBySession(await readSessionToken());
  if (!me) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  let body: { room?: string; email?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const slug = String(body.room || '').slice(0, 48);
  const email = String(body.email || '').trim().toLowerCase();
  if (!slug || !email) return Response.json({ ok: false, error: 'Missing room or user' }, { status: 400 });
  const conn = await getUserDb();
  try {
    await ensureChat(conn);
    const mine = await roomRole(conn, slug, me.email);
    const theirs = await roomRole(conn, slug, email);
    if (theirs === 'owner') {
      return Response.json({ ok: false, error: 'Cannot remove the host' }, { status: 400 });
    }
    if (theirs === 'admin' && !canOwnRoom(mine)) {
      return Response.json({ ok: false, error: 'Only the host can remove admins' }, { status: 403 });
    }
    if (mine !== 'owner' && mine !== 'admin') {
      return Response.json({ ok: false, error: 'Not allowed' }, { status: 403 });
    }
    await conn.execute('UPDATE mt_chat_members SET role = ? WHERE slug = ? AND email = ?', ['member', slug, email]);
    return Response.json({ ok: true });
  } finally {
    await conn.end();
  }
}
