import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';

async function ensure(conn: Awaited<ReturnType<typeof getUserDb>>) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_sdk_submissions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      game_id VARCHAR(40) NOT NULL,
      play_url VARCHAR(400) NOT NULL,
      cover_url VARCHAR(400) NOT NULL DEFAULT '',
      blurb VARCHAR(280) NOT NULL DEFAULT '',
      contact VARCHAR(190) NOT NULL DEFAULT '',
      username VARCHAR(120) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const gameId = String(body.gameId || body.game_id || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 40);
  const playUrl = String(body.playUrl || body.url || '').trim().slice(0, 400);
  const coverUrl = String(body.coverUrl || body.cover || '').trim().slice(0, 400);
  const blurb = String(body.blurb || '').trim().slice(0, 280);
  const contact = String(body.contact || body.email || '').trim().slice(0, 190);
  if (!gameId) return Response.json({ ok: false, error: 'Need a gameId (letters, numbers, dash)' }, { status: 400 });
  if (!/^https:\/\//i.test(playUrl)) return Response.json({ ok: false, error: 'Play URL must be https://' }, { status: 400 });
  if (blurb.length < 8) return Response.json({ ok: false, error: 'Need a one-line blurb' }, { status: 400 });
  const user = await userBySession(await readSessionToken());
  const conn = await getUserDb();
  try {
    await ensure(conn);
    await conn.execute(
      `INSERT INTO mt_sdk_submissions (game_id, play_url, cover_url, blurb, contact, username)
       VALUES (?,?,?,?,?,?)`,
      [gameId, playUrl, coverUrl, blurb, contact, user?.username || null]
    );
    return Response.json({ ok: true, queued: true, gameId });
  } catch (err) {
    console.error('sdk submit', err);
    return Response.json({ ok: false, error: 'Could not save listing' }, { status: 500 });
  } finally {
    await conn.end();
  }
}
