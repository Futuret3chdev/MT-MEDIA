import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';

async function ensure(conn: Awaited<ReturnType<typeof getUserDb>>) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_game_scores (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      game_id VARCHAR(40) NOT NULL,
      email VARCHAR(190) NULL,
      username VARCHAR(120) NOT NULL,
      score INT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY game_score (game_id, score),
      KEY email_game (email, game_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  try {
    await conn.execute('ALTER TABLE mt_game_scores ADD COLUMN room VARCHAR(48) NULL');
  } catch {
    /* exists */
  }
  try {
    await conn.execute('ALTER TABLE mt_game_scores ADD INDEX game_time (game_id, created_at)');
  } catch {
    /* exists */
  }
  try {
    await conn.execute('ALTER TABLE mt_game_scores ADD INDEX user_lookup (username)');
  } catch {
    /* exists */
  }
}

function periodSql(period: string) {
  if (period === 'day') return 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)';
  if (period === 'week') return 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
  if (period === 'month') return 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
  return '';
}

export async function GET(request: NextRequest) {
  const gameId = request.nextUrl.searchParams.get('game_id') || 'tap';
  const mine = request.nextUrl.searchParams.get('mine') === '1';
  const period = (request.nextUrl.searchParams.get('period') || 'all').toLowerCase();
  const q = String(request.nextUrl.searchParams.get('q') || '').trim().slice(0, 40);
  const limit = Math.max(1, Math.min(100, Number(request.nextUrl.searchParams.get('limit')) || 50));
  const offset = Math.max(0, Number(request.nextUrl.searchParams.get('offset')) || 0);
  const conn = await getUserDb();
  try {
    await ensure(conn);
    if (mine) {
      const user = await userBySession(await readSessionToken());
      if (!user) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
      const [rows] = await conn.execute(
        'SELECT id, game_id, username, score, created_at FROM mt_game_scores WHERE email = ? ORDER BY score DESC, id DESC LIMIT 50',
        [user.email]
      );
      return Response.json({ ok: true, scores: rows });
    }
    if (request.nextUrl.searchParams.get('games') === '1') {
      const [rows] = await conn.execute(
        `SELECT game_id, COUNT(*) AS plays, COUNT(DISTINCT username) AS players
         FROM mt_game_scores GROUP BY game_id ORDER BY plays DESC`
      );
      return Response.json({ ok: true, games: rows });
    }
    const room = request.nextUrl.searchParams.get('room');
    if (room) {
      const [rows] = await conn.execute(
        `SELECT username, MAX(score) AS score, MAX(created_at) AS created_at
         FROM mt_game_scores
         WHERE game_id = ? AND room = ?
         GROUP BY username
         ORDER BY score DESC
         LIMIT 25`,
        [gameId, room]
      );
      return Response.json({ ok: true, game_id: gameId, room, scores: rows });
    }
    const time = periodSql(period);
    const params: Array<string | number> = [];
    let where = 'WHERE 1=1';
    if (gameId && gameId !== 'all') {
      where += ' AND game_id = ?';
      params.push(gameId);
    }
    where += ` ${time}`;
    if (q) {
      where += ' AND username LIKE ?';
      params.push(`%${q.replace(/[%_]/g, '')}%`);
    }
    const [countRows] = await conn.execute(
      `SELECT COUNT(*) AS n FROM (
         SELECT username FROM mt_game_scores ${where} GROUP BY username
       ) t`,
      params
    );
    const total = Number((countRows as { n: number }[])[0]?.n || 0);
    const [rows] = await conn.execute(
      `SELECT username, MAX(score) AS score, MAX(created_at) AS created_at
       FROM mt_game_scores
       ${where}
       GROUP BY username
       ORDER BY score DESC, created_at ASC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    return Response.json({
      ok: true,
      game_id: gameId,
      period,
      q,
      total,
      limit,
      offset,
      scores: rows,
    });
  } catch (err) {
    console.error('scores get', err);
    return Response.json({ ok: false, error: 'Scores unavailable' }, { status: 500 });
  } finally {
    await conn.end();
  }
}

export async function POST(request: NextRequest) {
  const user = await userBySession(await readSessionToken());
  let body: { game_id?: string; score?: number; player_name?: string; room?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const gameId = String(body.game_id || 'tap').slice(0, 40);
  const score = Math.max(0, Math.min(1_000_000_000, Math.floor(Number(body.score) || 0)));
  const guest = String(body.player_name || 'Player').trim().slice(0, 20) || 'Player';
  const username = user?.username || guest;
  const email = user?.email || null;
  const conn = await getUserDb();
  try {
    await ensure(conn);
    const room = String(body.room || '').slice(0, 48) || null;
    if (room && email) {
      const [dup] = await conn.execute(
        `SELECT id FROM mt_game_scores
         WHERE game_id = ? AND room = ? AND email = ? AND score = ?
           AND created_at > DATE_SUB(NOW(), INTERVAL 2 MINUTE)
         LIMIT 1`,
        [gameId, room, email, score]
      );
      if ((dup as object[]).length) {
        return Response.json({ ok: true, success: true, attached: true, username, room, duplicate: true });
      }
    }
    await conn.execute(
      'INSERT INTO mt_game_scores (game_id, email, username, score, room) VALUES (?,?,?,?,?)',
      [gameId, email, username, score, room]
    );
    if (room) {
      try {
        const payload = JSON.stringify({ game_id: gameId, score }).slice(0, 800);
        const [chatDup] = await conn.execute(
          `SELECT id FROM mt_crypto_chat
           WHERE room = ? AND kind = 'score' AND username = ? AND body = ?
             AND created_at > DATE_SUB(NOW(), INTERVAL 2 MINUTE)
           LIMIT 1`,
          [room, username, payload]
        );
        if (!(chatDup as object[]).length) {
          await conn.execute(
            'INSERT INTO mt_crypto_chat (room, username, body, kind, owner_email) VALUES (?,?,?,?,?)',
            [room, username, payload, 'score', email]
          );
        }
      } catch {
        /* chat optional */
      }
    }
    return Response.json({
      ok: true,
      success: true,
      attached: !!user,
      username,
      room,
    });
  } catch (err) {
    console.error('scores post', err);
    return Response.json({ ok: false, error: 'Could not save score' }, { status: 500 });
  } finally {
    await conn.end();
  }
}
