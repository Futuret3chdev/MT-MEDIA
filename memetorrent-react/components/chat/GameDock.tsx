'use client';

import { useState } from 'react';
import { CATALOG, getGame } from '@/lib/mt-catalog';
import GameScores from '@/components/chat/GameScores';

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
  onTable,
  onRefresh,
  onOpened,
}: {
  room: string;
  sessions: RoomSession[];
  canAdd: boolean;
  inviteTo?: { username: string; email: string } | null;
  onPlay: (play: { url: string; id: string; title: string }) => void;
  onTable?: (title: string) => void;
  onRefresh: () => void;
  onOpened?: (slug: string, withUser?: { username: string; email: string }, gameId?: string | null) => void;
}) {
  const [pick, setPick] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scoresOpen, setScoresOpen] = useState(false);

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
        if (kind === 'rps' || kind === 'ttt') onTable?.(kind === 'rps' ? 'Rock paper scissors' : 'Tic-tac-toe');
      }
    } finally {
      setBusy(false);
    }
  };

  const playUrl = (s: RoomSession) => {
    let url = '';
    if (s.play && String(s.play).trim()) url = s.play;
    else {
      const g = getGame(s.game_id);
      if (g?.play) url = g.play;
      else if (s.game_id === 'tap') url = '/games/unix/tap/index.html';
    }
    if ((s.game_id === 'mt-world-pocket' || s.game_id === 'clubpool') && url && !/[?&]table=/.test(url)) {
      url += `${url.includes('?') ? '&' : '?'}table=POCK-${s.id}`;
    }
    return url;
  };

  const openSession = (s: RoomSession) => {
    const url = playUrl(s);
    if (url) {
      onPlay({ url, id: s.game_id || 'tap', title: s.title || 'Game' });
    }
    fetch('/api/chat/game', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, action: 'seat', id: s.id }),
    }).finally(() => onRefresh());
    if (s.game_id === 'rps' || s.game_id === 'ttt' || s.title.toLowerCase().includes('rock')) {
      onTable?.(s.game_id === 'ttt' ? 'Tic-tac-toe' : 'Rock paper scissors');
    }
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
        <button
          type="button"
          onClick={() => setScoresOpen(true)}
          className="shrink-0 text-xs font-semibold px-3 py-2 rounded-xl border border-white/15"
        >
          Scores
        </button>
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
              <div className="text-[11px] font-semibold text-emerald-400 mt-1">Play</div>
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
      {scoresOpen && <GameScores room={room} onClose={() => setScoresOpen(false)} />}
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
            className="text-left text-[11px] rounded-lg border border-emerald-400/40 p-2 col-span-2"
          >
            🪨📄✂️ Rock paper scissors
          </button>
          {CATALOG.filter((g) => g.status === 'live' && g.rated !== '18+' && g.kind !== 'adult').map((g) => (
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
