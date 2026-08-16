import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';

async function ensure(conn: Awaited<ReturnType<typeof getUserDb>>) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_studio_titles (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(190) NOT NULL,
      username VARCHAR(120) NOT NULL,
      name VARCHAR(80) NOT NULL,
      blurb VARCHAR(280) NOT NULL,
      play_url VARCHAR(400) NOT NULL,
      kind VARCHAR(24) NOT NULL DEFAULT 'arcade',
      config MEDIUMTEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY email_time (email, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export async function GET() {
  const user = await userBySession(await readSessionToken());
  if (!user) return Response.json({ ok: false, titles: [], error: 'Sign in' }, { status: 401 });
  const conn = await getUserDb();
  try {
    await ensure(conn);
    try {
      await conn.execute('ALTER TABLE mt_studio_titles ADD COLUMN config MEDIUMTEXT NULL');
    } catch {
      /* exists */
    }
    const [rows] = await conn.execute(
      'SELECT id, name, blurb, play_url, kind, config, created_at FROM mt_studio_titles WHERE email = ? ORDER BY id DESC LIMIT 40',
      [user.email]
    );
    return Response.json({ ok: true, titles: rows });
  } catch (err) {
    console.error('studio get', err);
    return Response.json({ ok: false, titles: [], error: 'Could not load titles' }, { status: 500 });
  } finally {
    await conn.end();
  }
}

export async function POST(request: NextRequest) {
  const user = await userBySession(await readSessionToken());
  if (!user) return Response.json({ ok: false, error: 'Sign in to publish.' }, { status: 401 });
  let body: { name?: string; blurb?: string; play_url?: string; kind?: string; config?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const name = String(body.name || '').trim().slice(0, 80);
  const blurb = String(body.blurb || '').trim().slice(0, 280);
  const kind = String(body.kind || 'arcade').slice(0, 24);
  const config = body.config ? JSON.stringify(body.config).slice(0, 20000) : null;
  if (name.length < 2) {
    return Response.json({ ok: false, error: 'Name is required.' }, { status: 400 });
  }
  const conn = await getUserDb();
  try {
    await ensure(conn);
    try {
      await conn.execute('ALTER TABLE mt_studio_titles ADD COLUMN config MEDIUMTEXT NULL');
    } catch {
      /* exists */
    }
    await conn.execute(
      'INSERT INTO mt_studio_titles (email, username, name, blurb, play_url, kind, config) VALUES (?,?,?,?,?,?,?)',
      [user.email, user.username, name, blurb, '', kind, config]
    );
    const [found] = await conn.execute(
      'SELECT id FROM mt_studio_titles WHERE email = ? ORDER BY id DESC LIMIT 1',
      [user.email]
    );
    const id = String((found as { id: unknown }[])[0]?.id || '');
    const play_url = `/studio/play/${id}`;
    await conn.execute('UPDATE mt_studio_titles SET play_url = ? WHERE id = ? AND email = ?', [
      play_url,
      id,
      user.email,
    ]);
    return Response.json({ ok: true, id, play_url });
  } catch (err) {
    console.error('studio post', err);
    return Response.json({ ok: false, error: 'Could not save title.' }, { status: 500 });
  } finally {
    await conn.end();
  }
}
