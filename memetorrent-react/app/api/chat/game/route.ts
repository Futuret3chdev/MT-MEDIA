import { NextRequest } from 'next/server';
import { getUserDb } from '@/lib/rewards-db';
import { readSessionToken, userBySession } from '@/lib/portal-auth';
import { canAccessRoom, canEditRoom, ensureChat, ensureDmChannel, isDmSlug, roomRole } from '@/lib/chat-core';
import { getGame } from '@/lib/mt-catalog';
import { addNotice } from '@/lib/chat-notices';

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

export async function GET(request: NextRequest) {
  const me = await userBySession(await readSessionToken());
  if (!me) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  const room = String(request.nextUrl.searchParams.get('room') || '').slice(0, 48);
  const conn = await getUserDb();
  try {
    await ensureChat(conn);
    if (room) {
      const [sessions] = await conn.execute(
        `SELECT id, room, game_id, title, play, host_email, host_username, status, created_at
         FROM mt_chat_room_games
         WHERE room = ? AND status = 'open'
         ORDER BY id DESC LIMIT 12`,
        [room]
      );
      const out = [];
      for (const s of sessions as {
        id: number;
        game_id: string;
        title: string;
        play: string | null;
        host_username: string;
      }[]) {
        const [seats] = await conn.execute(
          'SELECT username FROM mt_chat_game_seats WHERE session_id = ?',
          [s.id]
        );
        const [scores] = await conn.execute(
          `SELECT username, MAX(score) AS score
           FROM mt_game_scores
           WHERE game_id = ? AND room = ?
           GROUP BY username
           ORDER BY score DESC
           LIMIT 6`,
          [s.game_id, room]
        ).catch(() => [[]]);
        out.push({
          ...s,
          players: (seats as object[]).length,
          seats: seats,
          scores: scores || [],
        });
      }
      return Response.json({ ok: true, sessions: out });
    }
    const [rows] = await conn.execute(
      `SELECT id, from_email, from_username, room, game_id, title, play, created_at
       FROM mt_chat_game_invites
       WHERE to_email = ? AND seen = 0
       ORDER BY id DESC LIMIT 8`,
      [me.email]
    );
    return Response.json({ ok: true, invites: rows });
  } finally {
    await conn.end();
  }
}

export async function POST(request: NextRequest) {
  const me = await userBySession(await readSessionToken());
  if (!me) return Response.json({ ok: false, error: 'Sign in' }, { status: 401 });
  let body: {
    room?: string;
    action?: string;
    kind?: string;
    cell?: number;
    pick?: string;
    to?: string;
    id?: number;
    title?: string;
    scores?: { username: string; score: number }[];
  } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const action = String(body.action || '');
  if (action === 'recap') {
    const conn = await getUserDb();
    try {
      await ensureChat(conn);
      const room = String(body.room || '').slice(0, 48);
      const title = String(body.title || body.kind || 'Game');
      const scores = Array.isArray(body.scores) ? body.scores : [];
      const payload = JSON.stringify({
        game_id: String(body.kind || 'game'),
        title,
        scores,
      }).slice(0, 800);
      const [dup] = await conn.execute(
        `SELECT id FROM mt_crypto_chat
         WHERE room = ? AND kind = 'match' AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)
         LIMIT 1`,
        [room]
      );
      if (!(dup as object[]).length) {
        await conn.execute(
          'INSERT INTO mt_crypto_chat (room, username, body, kind, owner_email) VALUES (?,?,?,?,?)',
          [room, me.username, payload, 'match', me.email]
        );
      }
      return Response.json({ ok: true });
    } finally {
      await conn.end();
    }
  }
  if (action === 'seen') {
    const conn = await getUserDb();
    try {
      await ensureChat(conn);
      await conn.execute('UPDATE mt_chat_game_invites SET seen = 1 WHERE id = ? AND to_email = ?', [
        Number(body.id) || 0,
        me.email,
      ]);
      return Response.json({ ok: true });
    } finally {
      await conn.end();
    }
  }
  let room = String(body.room || '').slice(0, 48);
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
      let toEmail = String(body.to || '').trim().toLowerCase();
      let toName = '';
      if (toEmail && !toEmail.includes('@')) {
        const [found] = await conn.execute('SELECT email, username FROM portal_users WHERE username = ? LIMIT 1', [
          toEmail,
        ]);
        const u = (found as { email: string; username: string }[])[0];
        toEmail = u?.email?.toLowerCase() || '';
        toName = u?.username || '';
      } else if (toEmail) {
        const [found] = await conn.execute('SELECT username FROM portal_users WHERE email = ? LIMIT 1', [toEmail]);
        toName = String((found as { username: string }[])[0]?.username || '');
      }
      if (!toEmail && isDmSlug(room)) {
        const [pair] = await conn.execute(
          'SELECT owner_email, gate_note FROM mt_chat_channels WHERE slug = ? LIMIT 1',
          [room]
        );
        const p = (pair as { owner_email: string | null; gate_note: string | null }[])[0];
        const a = String(p?.owner_email || '').toLowerCase();
        const b = String(p?.gate_note || '').toLowerCase();
        toEmail = a === me.email.toLowerCase() ? b : a;
        if (toEmail) {
          const [found] = await conn.execute('SELECT username FROM portal_users WHERE email = ? LIMIT 1', [toEmail]);
          toName = String((found as { username: string }[])[0]?.username || '');
        }
      }
      if (!toEmail && ch.owner_email && !canEditRoom(role) && !isDmSlug(room)) {
        return Response.json({ ok: false, error: 'Only the host or staff can set the game' }, { status: 403 });
      }
      if (toEmail && toEmail !== me.email.toLowerCase()) {
        room = await ensureDmChannel(conn, me.email, toEmail, `@${toName || 'Direct'}`);
      }
      const kind = String(body.kind || 'ttt');
      let label = 'a game';
      let gameId = kind;
      if (kind === 'ttt') {
        label = 'tic-tac-toe';
        state = { kind: 'ttt', board: Array(9).fill(''), turn: 'x', x: me.email, o: toEmail || null, winner: null };
      } else if (kind === 'rps') {
        label = 'rock paper scissors';
        state = { kind: 'rps', a: me.email, b: toEmail || null, pickA: null, pickB: null, scoreA: 0, scoreB: 0 };
      } else {
        const g = getGame(kind);
        if (!g) return Response.json({ ok: false, error: 'Unknown game' }, { status: 400 });
        label = g.name;
        gameId = g.id;
        state = { kind: 'catalog', id: g.id };
      }
      await conn.execute('UPDATE mt_chat_channels SET game_id = ?, game_state = ? WHERE slug = ?', [
        gameId,
        JSON.stringify(state),
        room,
      ]);
      const play = kind !== 'ttt' && kind !== 'rps' ? getGame(kind)?.play || '' : '';
      const invite = JSON.stringify({ title: label, id: gameId, play });
      await conn.execute(
        'INSERT INTO mt_crypto_chat (room, username, body, kind, owner_email) VALUES (?,?,?,?,?)',
        [room, me.username, invite.slice(0, 800), 'game', me.email]
      );
      if (toEmail && toEmail !== me.email.toLowerCase()) {
        await conn.execute(
          'INSERT INTO mt_chat_game_invites (to_email, from_email, from_username, room, game_id, title, play) VALUES (?,?,?,?,?,?,?)',
          [toEmail, me.email, me.username, room, gameId, label, play || null]
        );
        await addNotice(conn, {
          to_email: toEmail,
          kind: 'game_invite',
          title: `@${me.username} wants to play ${label}`,
          href: `/chat?room=${encodeURIComponent(room)}`,
          from_email: me.email,
          from_username: me.username,
        });
      }
      const [created] = await conn.execute(
        'INSERT INTO mt_chat_room_games (room, game_id, title, play, host_email, host_username) VALUES (?,?,?,?,?,?)',
        [room, gameId, label, play || null, me.email, me.username]
      );
      const sessionId = Number((created as { insertId: number }).insertId || 0);
      if (sessionId) {
        await conn.execute('INSERT IGNORE INTO mt_chat_game_seats (session_id, email, username) VALUES (?,?,?)', [
          sessionId,
          me.email,
          me.username,
        ]);
        if (toEmail) {
          await conn.execute('INSERT IGNORE INTO mt_chat_game_seats (session_id, email, username) VALUES (?,?,?)', [
            sessionId,
            toEmail,
            toName || toEmail,
          ]);
        }
      }
      return Response.json({
        ok: true,
        game_id: gameId,
        state,
        slug: room,
        session_id: sessionId,
        with: toEmail ? { email: toEmail, username: toName } : null,
      });
    }

    if (action === 'seat') {
      const sid = Number(body.id) || 0;
      if (!sid) return Response.json({ ok: false, error: 'Missing game' }, { status: 400 });
      await conn.execute('INSERT IGNORE INTO mt_chat_game_seats (session_id, email, username) VALUES (?,?,?)', [
        sid,
        me.email,
        me.username,
      ]);
      return Response.json({ ok: true, session_id: sid });
    }

    if (action === 'close') {
      const sid = Number(body.id) || 0;
      await conn.execute("UPDATE mt_chat_room_games SET status = 'closed' WHERE id = ? AND host_email = ?", [
        sid,
        me.email,
      ]);
      return Response.json({ ok: true });
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
