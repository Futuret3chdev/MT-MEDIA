'use client';

import { useEffect, useState } from 'react';

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

type State = Ttt | Rps | null;

export default function TablePlay({
  room,
  me,
  title,
  onExit,
}: {
  room: string;
  me: string;
  title: string;
  onExit: () => void;
}) {
  const [state, setState] = useState<State>(null);
  const [err, setErr] = useState('');

  const load = () => {
    fetch(`/api/chat?room=${encodeURIComponent(room)}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        try {
          setState(d.channel?.game_state ? JSON.parse(d.channel.game_state) : null);
        } catch {
          setState(null);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 1000);
    return () => clearInterval(t);
  }, [room]);

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    setErr('');
    const d = await fetch('/api/chat/game', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, action, ...extra }),
    }).then((r) => r.json());
    if (!d.ok) {
      setErr(d.error || 'Could not move');
      return;
    }
    setState(d.state || null);
  };

  return (
    <div className="fixed inset-0 z-[260] bg-black/80 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#12141c] p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="font-semibold">{title}</div>
          <button
            type="button"
            className="text-xs font-semibold text-black bg-emerald-400 px-3 py-1.5 rounded-full"
            onClick={async () => {
              await act('finish');
              onExit();
            }}
          >
            Exit and save score
          </button>
        </div>
        {err && <div className="text-xs text-red-300">{err}</div>}

        {state?.kind === 'ttt' && (
          <div>
            <div className="text-[11px] opacity-60 mb-2">
              {!state.o
                ? 'Waiting for the other person to sit'
                : state.winner === 'draw'
                  ? 'Draw'
                  : state.winner
                    ? `${state.winner.toUpperCase()} wins`
                    : `${state.turn.toUpperCase()} to move`}
            </div>
            <div className="grid grid-cols-3 gap-1 w-44 mx-auto">
              {state.board.map((cell, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={!!state.winner || !!cell}
                  onClick={() => act('move', { cell: i })}
                  className="h-14 rounded-lg bg-black/50 border border-white/15 text-xl font-semibold"
                >
                  {cell ? cell.toUpperCase() : ''}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-3 text-xs">
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
            <div className="text-sm font-mono text-emerald-400 mb-1">
              {state.scoreA} – {state.scoreB}
            </div>
            <div className="text-[11px] opacity-60 mb-3">
              {!state.b
                ? 'Waiting for the other person to sit'
                : (state.a === me && state.pickA) || (state.b === me && state.pickB)
                  ? 'Waiting for their pick'
                  : 'Pick rock, paper or scissors'}
            </div>
            {!state.b && state.a !== me && (
              <button type="button" className="text-emerald-400 text-sm" onClick={() => act('join')}>
                Sit down
              </button>
            )}
            {state.b && (state.a === me || state.b === me) && (
              <div className="grid grid-cols-3 gap-2">
                {['rock', 'paper', 'scissors'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => act('pick', { pick: p })}
                    className="py-3 rounded-xl border border-white/15 capitalize text-sm"
                  >
                    {p === 'rock' ? '🪨 Rock' : p === 'paper' ? '📄 Paper' : '✂️ Scissors'}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!state && <p className="text-sm opacity-50">Loading the table…</p>}
      </div>
    </div>
  );
}
