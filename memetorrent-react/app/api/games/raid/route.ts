import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';

async function ensure(conn: Awaited<ReturnType<typeof getUserDb>>) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS mt_raid (
      code VARCHAR(8) NOT NULL PRIMARY KEY,
      host VARCHAR(80) NOT NULL,
      rug VARCHAR(80) NULL,
      phase VARCHAR(12) NOT NULL DEFAULT 'lobby',
      ends_ms BIGINT NOT NULL DEFAULT 0,
      players TEXT NOT NULL,
      votes TEXT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

type Room = {
  code: string;
  host: string;
  rug: string | null;
  phase: string;
  ends_ms: number;
  players: string;
  votes: string;
};

export async function GET(request: NextRequest) {
  const code = (request.nextUrl.searchParams.get('code') || '').toUpperCase();
  if (!code) return Response.json({ ok: true });
  const conn = await getUserDb();
  try {
    await ensure(conn);
    const [rows] = await conn.execute('SELECT * FROM mt_raid WHERE code = ?', [code]);
    const room = (rows as Room[])[0];
    if (!room) return Response.json({ ok: false, error: 'No room' }, { status: 404 });
    let phase = room.phase;
    if (phase === 'play' && Date.now() >= Number(room.ends_ms)) phase = 'vote';
    return Response.json({
      ok: true,
      code: room.code,
      host: room.host,
      phase,
      ends_in: Math.max(0, Math.ceil((Number(room.ends_ms) - Date.now()) / 1000)),
      players: JSON.parse(room.players || '[]'),
      votes: JSON.parse(room.votes || '{}'),
      rug: phase === 'end' ? room.rug : null,
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
  const action = String(body.action || '');
  const name = String(body.name || '').trim().slice(0, 80);
  const conn = await getUserDb();
  try {
    await ensure(conn);
    if (action === 'create') {
      if (!name) return Response.json({ ok: false, error: 'Need a name' }, { status: 400 });
      const code = Math.random().toString(36).slice(2, 6).toUpperCase();
      await conn.execute(
        'INSERT INTO mt_raid (code, host, rug, phase, ends_ms, players, votes) VALUES (?,?,NULL,?,?,?,?)',
        [code, name, 'lobby', 0, JSON.stringify([name]), '{}']
      );
      return Response.json({ ok: true, code });
    }
    const code = String(body.code || '').toUpperCase();
    const [rows] = await conn.execute('SELECT * FROM mt_raid WHERE code = ?', [code]);
    const room = (rows as Room[])[0];
    if (!room) return Response.json({ ok: false, error: 'No room' }, { status: 404 });
    const players = JSON.parse(room.players || '[]') as string[];
    const votes = JSON.parse(room.votes || '{}') as Record<string, string>;
    if (action === 'join') {
      if (!name) return Response.json({ ok: false, error: 'Need a name' }, { status: 400 });
      if (players.length >= 4) return Response.json({ ok: false, error: 'Full' }, { status: 400 });
      if (!players.includes(name)) players.push(name);
      await conn.execute('UPDATE mt_raid SET players = ? WHERE code = ?', [JSON.stringify(players), code]);
      return Response.json({ ok: true, code, players });
    }
    if (action === 'start') {
      if (players.length < 2) return Response.json({ ok: false, error: 'Need 2–4' }, { status: 400 });
      const rug = players[Math.floor(Math.random() * players.length)];
      await conn.execute(
        'UPDATE mt_raid SET rug = ?, phase = ?, ends_ms = ?, votes = ? WHERE code = ?',
        [rug, 'play', Date.now() + 8 * 60 * 1000, '{}', code]
      );
      return Response.json({ ok: true, you_are_rug: name === rug });
    }
    if (action === 'vote') {
      votes[name] = String(body.target || '');
      const done = Object.keys(votes).length >= players.length;
      await conn.execute('UPDATE mt_raid SET votes = ?, phase = ? WHERE code = ?', [
        JSON.stringify(votes),
        done ? 'end' : 'vote',
        code,
      ]);
      if (done) {
        const tally: Record<string, number> = {};
        Object.values(votes).forEach((t) => { tally[t] = (tally[t] || 0) + 1; });
        const picked = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0];
        const win = picked === room.rug;
        if (win) {
          players
            .filter((p) => p !== room.rug)
            .forEach((p) => {
              conn.execute(
                'INSERT INTO mt_game_scores (game_id, email, username, score, room) VALUES (?,?,?,?,?)',
                ['raid', null, p, 1, code]
              ).catch(() => {});
            });
        }
      }
      return Response.json({ ok: true });
    }
    if (action === 'me') {
      return Response.json({ ok: true, rug: room.phase !== 'lobby' && room.rug === name });
    }
    return Response.json({ ok: false, error: 'Unknown' }, { status: 400 });
  } finally {
    await conn.end();
  }
}
