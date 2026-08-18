import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';
import { isNightStaff } from '@/app/api/games/night/route';
import { SIGNAL_CARDS, signalHit } from '@/lib/signal-cards';

const LOCK_MS = 16000;
const REVEAL_MS = 6000;

async function ensure(conn: Awaited<ReturnType<typeof getUserDb>>) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_signal_round (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      card_id VARCHAR(24) NOT NULL,
      status VARCHAR(12) NOT NULL,
      ends_ms BIGINT NOT NULL,
      reveal_ms BIGINT NOT NULL,
      live TINYINT NOT NULL DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_signal_locks (
      round_id INT NOT NULL,
      username VARCHAR(80) NOT NULL,
      guess VARCHAR(40) NOT NULL,
      correct TINYINT NOT NULL DEFAULT 0,
      PRIMARY KEY (round_id, username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_signal_night (
      username VARCHAR(80) NOT NULL PRIMARY KEY,
      score INT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function latest(conn: Awaited<ReturnType<typeof getUserDb>>) {
  const [rows] = await conn.execute(
    'SELECT id, card_id, status, ends_ms, reveal_ms, live FROM mt_signal_round ORDER BY id DESC LIMIT 1'
  );
  return (rows as { id: number; card_id: string; status: string; ends_ms: number; reveal_ms: number; live: number }[])[0] || null;
}

async function start(conn: Awaited<ReturnType<typeof getUserDb>>) {
  const last = await latest(conn);
  const pool = SIGNAL_CARDS.filter((c) => c.id !== last?.card_id);
  const card = pool[Math.floor(Math.random() * pool.length)] || SIGNAL_CARDS[0];
  const now = Date.now();
  await conn.execute(
    'INSERT INTO mt_signal_round (card_id, status, ends_ms, reveal_ms, live) VALUES (?,?,?,?,1)',
    [card.id, 'guess', now + LOCK_MS, now + LOCK_MS + REVEAL_MS]
  );
}

async function tick(conn: Awaited<ReturnType<typeof getUserDb>>, liveWanted: boolean) {
  const now = Date.now();
  let r = await latest(conn);
  if (!r && liveWanted) {
    await start(conn);
    return latest(conn);
  }
  if (!r) return null;
  if (r.status === 'guess' && now >= Number(r.ends_ms)) {
    const card = SIGNAL_CARDS.find((c) => c.id === r!.card_id);
    const [locks] = await conn.execute('SELECT username, guess FROM mt_signal_locks WHERE round_id = ?', [r.id]);
    for (const row of locks as { username: string; guess: string }[]) {
      const ok = card ? signalHit(card.id, row.guess) : false;
      await conn.execute('UPDATE mt_signal_locks SET correct = ? WHERE round_id = ? AND username = ?', [
        ok ? 1 : 0,
        r.id,
        row.username,
      ]);
      if (ok) {
        await conn.execute(
          `INSERT INTO mt_signal_night (username, score) VALUES (?,1) ON DUPLICATE KEY UPDATE score = score + 1`,
          [row.username]
        );
        await conn
          .execute('INSERT INTO mt_game_scores (game_id, email, username, score, room) VALUES (?,?,?,?,?)', [
            'signal',
            null,
            row.username,
            1,
            'signal',
          ])
          .catch(() => {});
      }
    }
    await conn.execute('UPDATE mt_signal_round SET status = ? WHERE id = ?', ['reveal', r.id]);
    r = { ...r, status: 'reveal' };
  }
  if (r.status === 'reveal' && now >= Number(r.reveal_ms) && liveWanted) {
    await start(conn);
    return latest(conn);
  }
  return r;
}

export async function GET(request: NextRequest) {
  const me = await userBySession(await readSessionToken());
  const name = (me?.username || request.nextUrl.searchParams.get('as') || '').slice(0, 80);
  const liveWanted = request.nextUrl.searchParams.get('live') !== '0';
  const conn = await getUserDb();
  try {
    await ensure(conn);
    const r = await tick(conn, liveWanted);
    const card = r ? SIGNAL_CARDS.find((c) => c.id === r.card_id) : null;
    const revealing = r?.status === 'reveal';
    let names: string[] = [];
    let winners: string[] = [];
    let locked = false;
    if (r) {
      const [locks] = await conn.execute(
        'SELECT username, guess, correct FROM mt_signal_locks WHERE round_id = ?',
        [r.id]
      );
      const list = locks as { username: string; guess: string; correct: number }[];
      names = list.map((l) => l.username);
      locked = list.some((l) => l.username === name);
      if (revealing) winners = list.filter((l) => l.correct).map((l) => l.username);
    }
    const [board] = await conn.execute(
      'SELECT username, score FROM mt_signal_night ORDER BY score DESC LIMIT 20'
    );
    return Response.json({
      ok: true,
      staff: isNightStaff(request),
      you: name || null,
      round: r && card
        ? {
            id: r.id,
            status: r.status,
            glyphs: card.glyphs,
            answer: revealing ? card.answers[0] : '',
            ends_in: Math.max(
              0,
              Math.ceil((Number(r.status === 'guess' ? r.ends_ms : r.reveal_ms) - Date.now()) / 1000)
            ),
            locked,
            locked_names: names,
            winners,
          }
        : null,
      board,
    });
  } finally {
    await conn.end();
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const me = await userBySession(await readSessionToken());
  const name = (me?.username || String(body.name || '')).trim().slice(0, 80);
  const conn = await getUserDb();
  try {
    await ensure(conn);
    if (String(body.action || 'lock') === 'lock') {
      if (!name) return Response.json({ ok: false, error: 'Need a handle' }, { status: 400 });
      const r = await tick(conn, true);
      if (!r || r.status !== 'guess') return Response.json({ ok: false, error: 'Round closed' }, { status: 400 });
      await conn.execute(
        'INSERT IGNORE INTO mt_signal_locks (round_id, username, guess, correct) VALUES (?,?,?,0)',
        [r.id, name, String(body.guess || '').slice(0, 40)]
      );
      return Response.json({ ok: true });
    }
    if (!isNightStaff(request)) return Response.json({ ok: false, error: 'Staff only' }, { status: 401 });
    if (body.action === 'next') {
      await start(conn);
      return Response.json({ ok: true });
    }
    if (body.action === 'reset') {
      await conn.execute('DELETE FROM mt_signal_night');
      return Response.json({ ok: true });
    }
    return Response.json({ ok: false, error: 'Unknown' }, { status: 400 });
  } finally {
    await conn.end();
  }
}
