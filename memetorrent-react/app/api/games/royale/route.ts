import { NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';
import { ROYALE_CARDS, cardById, royaleHit } from '@/lib/royale-puzzles';

const PIN = process.env.EMOJI_STAFF_PIN || '376937';
const PASS_HASH =
  process.env.EMOJI_STAFF_HASH || '$2b$10$MLq2YyrbFq.1PZ92oQ9IiezGi4LlvmQLjVSO7/RvwbvMlT4UB1zqu';
const COOKIE = 'mt_royale_staff';
const SECRET = process.env.EMOJI_STAFF_SECRET || 'mt-emoji-staff-v1';
const ROUND_MS = 14000;
const REVEAL_MS = 6000;

function staffTok() {
  return createHmac('sha256', SECRET).update('royale-ok').digest('hex');
}
function isStaff(req: NextRequest) {
  const raw = req.cookies.get(COOKIE)?.value || req.cookies.get('mt_emoji_staff')?.value || '';
  const want = staffTok();
  try {
    return raw.length === want.length && timingSafeEqual(Buffer.from(raw), Buffer.from(want));
  } catch {
    return false;
  }
}

async function ensure(conn: Awaited<ReturnType<typeof getUserDb>>) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_royale_event (
      id TINYINT NOT NULL PRIMARY KEY,
      prize VARCHAR(180) NOT NULL DEFAULT '',
      note VARCHAR(240) NOT NULL DEFAULT '',
      live TINYINT NOT NULL DEFAULT 0,
      seconds INT NOT NULL DEFAULT 14
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await conn.execute(`INSERT IGNORE INTO mt_royale_event (id, prize, note, live) VALUES (1, '', 'Emoji Royale', 0)`);
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_royale_round (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      puzzle_id VARCHAR(40) NOT NULL,
      status VARCHAR(12) NOT NULL,
      ends_ms BIGINT NOT NULL,
      reveal_ms BIGINT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_royale_locks (
      round_id INT NOT NULL,
      username VARCHAR(80) NOT NULL,
      guess VARCHAR(80) NOT NULL,
      correct TINYINT NOT NULL DEFAULT 0,
      PRIMARY KEY (round_id, username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_royale_night (
      username VARCHAR(80) NOT NULL PRIMARY KEY,
      score INT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function latestRound(conn: Awaited<ReturnType<typeof getUserDb>>) {
  const [rows] = await conn.execute(
    'SELECT id, puzzle_id, status, ends_ms, reveal_ms FROM mt_royale_round ORDER BY id DESC LIMIT 1'
  );
  return (rows as { id: number; puzzle_id: string; status: string; ends_ms: number; reveal_ms: number }[])[0] || null;
}

async function startRound(conn: Awaited<ReturnType<typeof getUserDb>>, seconds: number) {
  const last = await latestRound(conn);
  const used = last ? last.puzzle_id : '';
  const pool = ROYALE_CARDS.filter((c) => c.id !== used);
  const card = pool[Math.floor(Math.random() * pool.length)] || ROYALE_CARDS[0];
  const now = Date.now();
  const [res] = await conn.execute(
    'INSERT INTO mt_royale_round (puzzle_id, status, ends_ms, reveal_ms) VALUES (?,?,?,?)',
    [card.id, 'guess', now + seconds * 1000, now + seconds * 1000 + REVEAL_MS]
  );
  const id = (res as { insertId?: number }).insertId;
  return { id, card };
}

async function settle(conn: Awaited<ReturnType<typeof getUserDb>>, roundId: number, puzzleId: string) {
  const card = cardById(puzzleId);
  if (!card) return;
  const [locks] = await conn.execute('SELECT username, guess FROM mt_royale_locks WHERE round_id = ?', [roundId]);
  for (const row of locks as { username: string; guess: string }[]) {
    const ok = royaleHit(card, row.guess);
    await conn.execute('UPDATE mt_royale_locks SET correct = ? WHERE round_id = ? AND username = ?', [
      ok ? 1 : 0,
      roundId,
      row.username,
    ]);
    if (ok) {
      await conn.execute(
        `INSERT INTO mt_royale_night (username, score) VALUES (?, 1)
         ON DUPLICATE KEY UPDATE score = score + 1`,
        [row.username]
      );
      await conn.execute(
        'INSERT INTO mt_game_scores (game_id, email, username, score, room) VALUES (?,?,?,?,?)',
        ['emoji-royale', null, row.username, 1, 'royale']
      ).catch(() => {});
    }
  }
}

async function tick(conn: Awaited<ReturnType<typeof getUserDb>>, seconds: number, live: boolean) {
  const now = Date.now();
  let round = await latestRound(conn);
  if (!round && live) {
    await startRound(conn, seconds);
    return latestRound(conn);
  }
  if (!round) return null;
  if (round.status === 'guess' && now >= Number(round.ends_ms)) {
    await settle(conn, round.id, round.puzzle_id);
    await conn.execute('UPDATE mt_royale_round SET status = ? WHERE id = ?', ['reveal', round.id]);
    round = { ...round, status: 'reveal' };
  }
  if (round.status === 'reveal' && now >= Number(round.reveal_ms) && live) {
    await startRound(conn, seconds);
    return latestRound(conn);
  }
  return round;
}

export async function GET(request: NextRequest) {
  const me = await userBySession(await readSessionToken());
  const guest = request.nextUrl.searchParams.get('as') || '';
  const name = (me?.username || guest).slice(0, 80);
  const conn = await getUserDb();
  try {
    await ensure(conn);
    const [evRows] = await conn.execute('SELECT prize, note, live, seconds FROM mt_royale_event WHERE id = 1');
    const ev = (evRows as { prize: string; note: string; live: number; seconds: number }[])[0];
    const live = ev ? ev.live === 1 : false;
    const seconds = ev?.seconds || 14;
    const round = await tick(conn, seconds, live);
    const card = round ? cardById(round.puzzle_id) : null;
    const now = Date.now();
    const revealing = round?.status === 'reveal';
    let locked = false;
    let myGuess = '';
    let names: string[] = [];
    let winners: string[] = [];
    if (round) {
      const [locks] = await conn.execute(
        'SELECT username, guess, correct FROM mt_royale_locks WHERE round_id = ?',
        [round.id]
      );
      const list = locks as { username: string; guess: string; correct: number }[];
      names = list.map((l) => l.username);
      const mine = list.find((l) => l.username === name);
      locked = !!mine;
      if (revealing && mine) myGuess = mine.guess;
      if (revealing) winners = list.filter((l) => l.correct).map((l) => l.username);
    }
    const [board] = await conn.execute(
      'SELECT username, score FROM mt_royale_night ORDER BY score DESC, username ASC LIMIT 20'
    );
    return Response.json({
      ok: true,
      staff: isStaff(request),
      prize: ev?.prize || '',
      note: ev?.note || '',
      live,
      seconds,
      you: name || null,
      round: round && card
        ? {
            id: round.id,
            status: round.status,
            emojis: card.emojis,
            hint: revealing ? card.hint : '',
            answer: revealing ? card.answers[0] : '',
            ends_in: Math.max(0, Math.ceil((Number(round.status === 'guess' ? round.ends_ms : round.reveal_ms) - now) / 1000)),
            locked,
            locked_n: names.length,
            locked_names: names.slice(0, 24),
            winners,
            my_guess: myGuess,
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
  const action = String(body.action || 'lock');

  if (action === 'login') {
    const okPin = String(body.pin || '') === PIN;
    const okPw = await bcrypt.compare(String(body.password || ''), PASS_HASH);
    if (!okPin || !okPw) return Response.json({ ok: false, error: 'Wrong pin or password' }, { status: 401 });
    const res = Response.json({ ok: true, staff: true });
    res.headers.append('Set-Cookie', `${COOKIE}=${staffTok()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
    return res;
  }

  const conn = await getUserDb();
  try {
    await ensure(conn);
    if (action === 'lock') {
      const me = await userBySession(await readSessionToken());
      const name = (me?.username || String(body.name || '')).trim().slice(0, 80);
      if (!name) return Response.json({ ok: false, error: 'Sign in or pick a handle' }, { status: 400 });
      const [evRows] = await conn.execute('SELECT live, seconds FROM mt_royale_event WHERE id = 1');
      const ev = (evRows as { live: number; seconds: number }[])[0];
      const round = await tick(conn, ev?.seconds || 14, ev?.live === 1);
      if (!round || round.status !== 'guess' || Date.now() >= Number(round.ends_ms)) {
        return Response.json({ ok: false, error: 'Round closed' }, { status: 400 });
      }
      await conn.execute(
        `INSERT IGNORE INTO mt_royale_locks (round_id, username, guess, correct) VALUES (?,?,?,0)`,
        [round.id, name, String(body.guess || '').slice(0, 80)]
      );
      return Response.json({ ok: true, locked: true });
    }

    if (!isStaff(request)) return Response.json({ ok: false, error: 'Staff only' }, { status: 401 });

    if (action === 'prize') {
      await conn.execute('UPDATE mt_royale_event SET prize = ?, note = ? WHERE id = 1', [
        String(body.prize || '').slice(0, 180),
        String(body.note || '').slice(0, 240),
      ]);
      return Response.json({ ok: true });
    }
    if (action === 'live') {
      await conn.execute('UPDATE mt_royale_event SET live = ? WHERE id = 1', [body.live ? 1 : 0]);
      if (body.live) {
        const [evRows] = await conn.execute('SELECT seconds FROM mt_royale_event WHERE id = 1');
        const seconds = (evRows as { seconds: number }[])[0]?.seconds || 14;
        await startRound(conn, seconds);
      }
      return Response.json({ ok: true });
    }
    if (action === 'next') {
      const [evRows] = await conn.execute('SELECT seconds FROM mt_royale_event WHERE id = 1');
      await startRound(conn, (evRows as { seconds: number }[])[0]?.seconds || 14);
      return Response.json({ ok: true });
    }
    if (action === 'reset') {
      await conn.execute('DELETE FROM mt_royale_night');
      return Response.json({ ok: true });
    }
    return Response.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } finally {
    await conn.end();
  }
}
