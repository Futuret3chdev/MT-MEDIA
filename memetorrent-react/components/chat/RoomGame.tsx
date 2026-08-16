'use client';

import { useState } from 'react';
import { CATALOG, getGame } from '@/lib/mt-catalog';

export type GameState =
  | {
      kind: 'ttt';
      board: string[];
      turn: 'x' | 'o';
      x: string;
      o: string | null;
      winner: null | 'x' | 'o' | 'draw';
    }
  | {
      kind: 'rps';
      a: string;
      b: string | null;
      pickA: string | null;
      pickB: string | null;
      scoreA: number;
      scoreB: number;
    }
  | { kind: 'catalog'; id: string };

export default function RoomGame({
  room,
  gameId,
  state,
  me,
  canEdit,
  onChange,
}: {
  room: string;
  gameId: string | null | undefined;
  state: GameState | null;
  me: string;
  canEdit: boolean;
  onChange: (game_id: string | null, state: GameState | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [openPick, setOpenPick] = useState(false);

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    try {
      const res = await fetch('/api/chat/game', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room, action, ...extra }),
      });
      const d = await res.json();
      if (d.ok) {
        onChange(d.game_id || null, d.state || null);
        if (action === 'start') setOpenPick(false);
      }
    } finally {
      setBusy(false);
    }
  };

  const catalog = gameId && gameId !== 'ttt' && gameId !== 'rps' ? getGame(gameId) : null;

  return (
    <div className="px-3 py-2 border-b border-white/5 space-y-2">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-emerald-400">
        <span>Room game</span>
        {canEdit && (
          <button type="button" className="normal-case tracking-normal text-[11px]" onClick={() => setOpenPick((v) => !v)}>
            {openPick ? 'Close' : 'Set game'}
          </button>
        )}
        {gameId && canEdit && (
          <button type="button" className="normal-case tracking-normal text-[11px] opacity-60" onClick={() => act('clear')}>
            Clear
          </button>
        )}
      </div>
      {openPick && canEdit && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
          <button
            type="button"
            disabled={busy}
            onClick={() => act('start', { kind: 'ttt' })}
            className="text-left text-[11px] rounded-lg border border-white/15 p-2"
          >
            Tic-tac-toe
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => act('start', { kind: 'rps' })}
            className="text-left text-[11px] rounded-lg border border-white/15 p-2"
          >
            Rock paper scissors
          </button>
          {CATALOG.filter((g) => g.status === 'live').map((g) => (
            <button
              key={g.id}
              type="button"
              disabled={busy}
              onClick={() => act('start', { kind: g.id })}
              className="text-left text-[11px] rounded-lg border border-white/15 p-2 truncate"
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {state?.kind === 'ttt' && (
        <div>
          <div className="text-[11px] opacity-60 mb-1">
            {!state.o
              ? 'Waiting for a second player'
              : state.winner === 'draw'
                ? 'Draw'
                : state.winner
                  ? `${state.winner.toUpperCase()} wins`
                  : `${state.turn.toUpperCase()} to move`}
          </div>
          <div className="grid grid-cols-3 gap-1 w-40">
            {state.board.map((cell, i) => (
              <button
                key={i}
                type="button"
                disabled={busy || !!state.winner || !!cell}
                onClick={() => act('move', { cell: i })}
                className="h-12 rounded-lg bg-black/50 border border-white/15 text-lg font-semibold"
              >
                {cell ? cell.toUpperCase() : ''}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-2 text-[11px]">
            {!state.o && state.x !== me && (
              <button type="button" className="text-emerald-400" onClick={() => act('join')}>
                Sit down
              </button>
            )}
            {!!state.winner && (
              <button type="button" className="text-emerald-400" onClick={() => act('reset')}>
                Play again
              </button>
            )}
          </div>
        </div>
      )}

      {state?.kind === 'rps' && (
        <div>
          <div className="text-[11px] opacity-60 mb-1">
            {state.scoreA} – {state.scoreB}
            {!state.b ? ' · waiting for a second player' : ''}
          </div>
          {!state.b && state.a !== me && (
            <button type="button" className="text-emerald-400 text-[11px]" onClick={() => act('join')}>
              Sit down
            </button>
          )}
          {state.b && (state.a === me || state.b === me) && (
            <div className="flex gap-2">
              {['rock', 'paper', 'scissors'].map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={busy}
                  onClick={() => act('pick', { pick: p })}
                  className="px-2 py-1 rounded-lg border border-white/15 text-[11px] capitalize"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {catalog && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3 flex gap-3 items-center">
          <img src={catalog.img} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{catalog.name} is on for this room</div>
            <div className="text-[11px] opacity-60">They stay in chat until they tap Join. You are not pulled out.</div>
            <a
              href={catalog.play}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-1 text-emerald-400 text-[11px] font-semibold"
            >
              Join game
            </a>
          </div>
        </div>
      )}

      {!gameId && !openPick && (
        <p className="text-[11px] opacity-40">Host can set a catalog game or a table game for this room.</p>
      )}
    </div>
  );
}
