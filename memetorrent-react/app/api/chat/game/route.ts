import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';
import { canAccessRoom, canEditRoom, ensureChat, roomRole } from '@/lib/chat-core';
import { getGame } from '@/lib/mt-catalog';

type Ttt = {
  kind: 'ttt';
  board: string[];
  turn: 'x' | 'o';
  x: string;
  o: string | null;
  winner: null | 'x' | 'o' | 'draw';
};

type Rps = {
  kind: 'rps';
  a: string;
  b: string | null;
  pickA: string | null;
  pickB: string | null;
  scoreA: number;
  scoreB: number;
};

function lines(b: string[]) {
  const w = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const [i, j, k] of w) {
    if (b[i] && b[i] === b[j] && b[j] === b[k]) return b[i] as 'x' | 'o';
  }
  if (b.every(Boolean)) return 'draw';
  return null;
}

export async function POST(request: NextRequest) {
  const me = await userBySession(await readSessionToken());
  if (!me) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  let body: { room?: string; action?: string; kind?: string; cell?: number; pick?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const room = String(body.room || '').slice(0, 48);
  const action = String(body.action || '');
  if (!room) return Response.json({ ok: false, error: 'Missing room' }, { status: 400 });
  const conn = await getUserDb();
  try {
    await ensureChat(conn);
    if (!(await canAccessRoom(conn, room, me.email))) {
      return Response.json({ ok: false, error: 'Private room' }, { status: 403 });
    }
    const role = await roomRole(conn, room, me.email);
    const [rows] = await conn.execute(
      'SELECT game_id, game_state, owner_email FROM mt_chat_channels WHERE slug = ? LIMIT 1',
      [room]
    );
    const ch = (rows as { game_id: string | null; game_state: string | null; owner_email: string | null }[])[0];
    if (!ch) return Response.json({ ok: false, error: 'Unknown room' }, { status: 404 });
    let state: Ttt | Rps | { kind: 'catalog'; id: string } | null = null;
    try {
      state = ch.game_state ? JSON.parse(ch.game_state) : null;
    } catch {
      state = null;
    }

    if (action === 'start') {
      if (ch.owner_email && !canEditRoom(role)) {
        return Response.json({ ok: false, error: 'Only the host or staff can set the game' }, { status: 403 });
      }
      const kind = String(body.kind || 'ttt');
      if (kind === 'ttt') {
        state = { kind: 'ttt', board: Array(9).fill(''), turn: 'x', x: me.email, o: null, winner: null };
        await conn.execute('UPDATE mt_chat_channels SET game_id = ?, game_state = ? WHERE slug = ?', [
          'ttt',
          JSON.stringify(state),
          room,
        ]);
      } else if (kind === 'rps') {
        state = { kind: 'rps', a: me.email, b: null, pickA: null, pickB: null, scoreA: 0, scoreB: 0 };
        await conn.execute('UPDATE mt_chat_channels SET game_id = ?, game_state = ? WHERE slug = ?', [
          'rps',
          JSON.stringify(state),
          room,
        ]);
      } else {
        const g = getGame(kind);
        if (!g) return Response.json({ ok: false, error: 'Unknown game' }, { status: 400 });
        state = { kind: 'catalog', id: g.id };
        await conn.execute('UPDATE mt_chat_channels SET game_id = ?, game_state = ? WHERE slug = ?', [
          g.id,
          JSON.stringify(state),
          room,
        ]);
      }
      return Response.json({ ok: true, game_id: kind === 'ttt' || kind === 'rps' ? kind : getGame(kind)?.id, state });
    }

    if (action === 'clear') {
      if (ch.owner_email && !canEditRoom(role)) {
        return Response.json({ ok: false, error: 'Only the host or staff can clear the game' }, { status: 403 });
      }
      await conn.execute('UPDATE mt_chat_channels SET game_id = NULL, game_state = NULL WHERE slug = ?', [room]);
      return Response.json({ ok: true, game_id: null, state: null });
    }

    if (action === 'join' && state?.kind === 'ttt' && !state.o && state.x !== me.email) {
      state.o = me.email;
    } else if (action === 'join' && state?.kind === 'rps' && !state.b && state.a !== me.email) {
      state.b = me.email;
    } else if (action === 'move' && state?.kind === 'ttt' && !state.winner) {
      const cell = Number(body.cell);
      const mark = state.x === me.email ? 'x' : state.o === me.email ? 'o' : '';
      if (!mark) return Response.json({ ok: false, error: 'Join first' }, { status: 400 });
      if (state.turn !== mark) return Response.json({ ok: false, error: 'Not your turn' }, { status: 400 });
      if (cell < 0 || cell > 8 || state.board[cell]) {
        return Response.json({ ok: false, error: 'Bad move' }, { status: 400 });
      }
      state.board[cell] = mark;
      state.winner = lines(state.board);
      if (!state.winner) state.turn = mark === 'x' ? 'o' : 'x';
    } else if (action === 'reset' && state?.kind === 'ttt') {
      if (state.x !== me.email && state.o !== me.email) {
        return Response.json({ ok: false, error: 'Not in this game' }, { status: 403 });
      }
      state.board = Array(9).fill('');
      state.turn = 'x';
      state.winner = null;
    } else if (action === 'pick' && state?.kind === 'rps') {
      const pick = ['rock', 'paper', 'scissors'].includes(String(body.pick)) ? String(body.pick) : '';
      if (!pick) return Response.json({ ok: false, error: 'Pick rock, paper or scissors' }, { status: 400 });
      if (state.a === me.email) state.pickA = pick;
      else if (state.b === me.email) state.pickB = pick;
      else return Response.json({ ok: false, error: 'Join first' }, { status: 400 });
      if (state.pickA && state.pickB) {
        const beats: Record<string, string> = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
        if (state.pickA !== state.pickB) {
          if (beats[state.pickA] === state.pickB) state.scoreA += 1;
          else state.scoreB += 1;
        }
        state.pickA = null;
        state.pickB = null;
      }
    } else {
      return Response.json({ ok: false, error: 'Nothing to do' }, { status: 400 });
    }

    await conn.execute('UPDATE mt_chat_channels SET game_state = ? WHERE slug = ?', [JSON.stringify(state), room]);
    return Response.json({ ok: true, game_id: ch.game_id, state });
  } finally {
    await conn.end();
  }
}
