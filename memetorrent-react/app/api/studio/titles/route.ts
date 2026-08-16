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
    const [rows] = await conn.execute(
      'SELECT id, name, blurb, play_url, kind, created_at FROM mt_studio_titles WHERE email = ? ORDER BY id DESC LIMIT 40',
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
  let body: { name?: string; blurb?: string; play_url?: string; kind?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const name = String(body.name || '').trim().slice(0, 80);
  const blurb = String(body.blurb || '').trim().slice(0, 280);
  const play_url = String(body.play_url || '').trim().slice(0, 400);
  const kind = String(body.kind || 'arcade').slice(0, 24);
  if (name.length < 2 || !play_url) {
    return Response.json({ ok: false, error: 'Name and play URL are required.' }, { status: 400 });
  }
  const conn = await getUserDb();
  try {
    await ensure(conn);
    await conn.execute(
      'INSERT INTO mt_studio_titles (email, username, name, blurb, play_url, kind) VALUES (?,?,?,?,?,?)',
      [user.email, user.username, name, blurb, play_url, kind]
    );
    return Response.json({ ok: true });
  } catch (err) {
    console.error('studio post', err);
    return Response.json({ ok: false, error: 'Could not save title.' }, { status: 500 });
  } finally {
    await conn.end();
  }
}
