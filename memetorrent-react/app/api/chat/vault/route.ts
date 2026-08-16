import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';
import { ensureChat, ensurePersonalVault, vaultSlug } from '@/lib/chat-core';

export async function GET() {
  const me = await userBySession(await readSessionToken());
  if (!me) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  const conn = await getUserDb();
  try {
    await ensureChat(conn);
    const slug = await ensurePersonalVault(conn, me.email, me.username);
    const [ch] = await conn.execute(
      `SELECT slug, name, kind, topic, background, music_url, show_chart, collab_note
       FROM mt_chat_channels WHERE slug = ? LIMIT 1`,
      [slug]
    );
    const [items] = await conn.execute(
      `SELECT id, kind, body, created_at FROM mt_crypto_chat
       WHERE room = ? AND kind IN ('image','audio','video','file')
       ORDER BY id DESC LIMIT 80`,
      [slug]
    );
    return Response.json({
      ok: true,
      slug,
      channel: (ch as object[])[0] || { slug, name: 'My vault', kind: 'vault' },
      items,
    });
  } finally {
    await conn.end();
  }
}

export async function POST(request: NextRequest) {
  const me = await userBySession(await readSessionToken());
  if (!me) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  let body: { url?: string; name?: string; kind?: string; note?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const conn = await getUserDb();
  try {
    await ensureChat(conn);
    const slug = await ensurePersonalVault(conn, me.email, me.username);
    if (typeof body.note === 'string') {
      await conn.execute('UPDATE mt_chat_channels SET collab_note = ? WHERE slug = ?', [
        body.note.slice(0, 20000),
        slug,
      ]);
    }
    if (body.url) {
      const kind = ['image', 'audio', 'video', 'file'].includes(String(body.kind)) ? String(body.kind) : 'file';
      const payload = JSON.stringify({ url: String(body.url).slice(0, 400), name: String(body.name || 'item').slice(0, 160) });
      await conn.execute(
        'INSERT INTO mt_crypto_chat (room, username, body, kind, owner_email) VALUES (?,?,?,?,?)',
        [slug, me.username, payload.slice(0, 800), kind, me.email]
      );
    }
    return Response.json({ ok: true, slug, path: `/chat?room=${slug}` });
  } finally {
    await conn.end();
  }
}

export function personalVaultSlug(email: string) {
  return vaultSlug(email);
}
