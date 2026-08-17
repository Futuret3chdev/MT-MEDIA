'use client';

import { useState } from 'react';
import { CATALOG } from '@/lib/mt-catalog';

export type RoomSession = {
  id: number;
  game_id: string;
  title: string;
  play: string | null;
  host_username: string;
  players: number;
  scores: { username: string; score: number }[];
};

export default function GameDock({
  room,
  sessions,
  canAdd,
  inviteTo,
  onPlay,
  onRefresh,
  onOpened,
}: {
  room: string;
  sessions: RoomSession[];
  canAdd: boolean;
  inviteTo?: { username: string; email: string } | null;
  onPlay: (play: { url: string; id: string; title: string }) => void;
  onRefresh: () => void;
  onOpened?: (slug: string, withUser?: { username: string; email: string }, gameId?: string | null) => void;
}) {
  const [pick, setPick] = useState(false);
  const [busy, setBusy] = useState(false);

  const start = async (kind: string) => {
    setBusy(true);
    try {
      const d = await fetch('/api/chat/game', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room,
          action: 'start',
          kind,
          to: inviteTo?.email || inviteTo?.username,
        }),
      }).then((r) => r.json());
      if (d.ok) {
        setPick(false);
        if (d.slug && d.with) onOpened?.(d.slug, d.with, d.game_id);
        onRefresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const openSession = async (s: RoomSession) => {
    await fetch('/api/chat/game', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, action: 'join', id: s.id }),
    });
    if (s.play) onPlay({ url: s.play, id: s.game_id, title: s.title });
    onRefresh();
  };

  const closeSession = async (id: number) => {
    await fetch('/api/chat/game', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, action: 'close', id }),
    });
    onRefresh();
  };

  return (
    <div className="px-3 py-2 border-t border-emerald-400/25 bg-black/70">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {canAdd && (
          <button
            type="button"
            onClick={() => setPick((v) => !v)}
            className="shrink-0 text-xs font-semibold px-3 py-2 rounded-xl border border-emerald-400/40 text-emerald-400"
          >
            {pick ? 'Close' : '+ Game'}
          </button>
        )}
        {sessions.map((s) => (
          <div
            key={s.id}
            className="shrink-0 min-w-[9.5rem] rounded-xl border border-white/15 bg-[#12141c] px-2.5 py-2"
          >
            <button type="button" className="w-full text-left" onClick={() => openSession(s)}>
              <div className="text-xs font-semibold truncate">{s.title}</div>
              <div className="text-[10px] opacity-60">{s.players} playing</div>
              <div className="text-[10px] font-mono text-emerald-400 truncate">
                {s.scores.length
                  ? s.scores.map((x) => `${x.username} ${x.score}`).join(' · ')
                  : 'No scores yet'}
              </div>
            </button>
            <button type="button" className="text-[10px] opacity-40 mt-1" onClick={() => closeSession(s.id)}>
              End
            </button>
          </div>
        ))}
        {!sessions.length && !pick && (
          <span className="text-[11px] opacity-40">Games sit here. Add one — nobody scrolls the thread.</span>
        )}
      </div>
      {pick && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 max-h-40 overflow-y-auto">
          <button
            type="button"
            disabled={busy}
            onClick={() => start('ttt')}
            className="text-left text-[11px] rounded-lg border border-white/15 p-2"
          >
            Tic-tac-toe
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => start('rps')}
            className="text-left text-[11px] rounded-lg border border-white/15 p-2"
          >
            Rock paper scissors
          </button>
          {CATALOG.filter((g) => g.status === 'live').map((g) => (
            <button
              key={g.id}
              type="button"
              disabled={busy}
              onClick={() => start(g.id)}
              className="text-left text-[11px] rounded-lg border border-white/15 p-2 truncate"
            >
              {g.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
