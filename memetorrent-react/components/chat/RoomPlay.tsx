'use client';

import { useEffect, useRef, useState } from 'react';

export default function RoomPlay({
  url,
  gameId,
  title,
  room,
  onExit,
}: {
  url: string;
  gameId: string;
  title: string;
  room: string;
  onExit: () => void;
}) {
  const [scores, setScores] = useState<{ username: string; score: number }[] | null>(null);
  const recap = useRef(false);
  const src = `${url}${url.includes('?') ? '&' : '?'}room=${encodeURIComponent(room)}&from=chat`;

  const finish = async () => {
    let list: { username: string; score: number }[] = [];
    try {
      const d = await fetch(
        `/api/scores?game_id=${encodeURIComponent(gameId)}&room=${encodeURIComponent(room)}`,
        { credentials: 'include' }
      ).then((r) => r.json());
      list = d.scores || [];
      if (!list.length) {
        const all = await fetch(`/api/scores?game_id=${encodeURIComponent(gameId)}`, { credentials: 'include' }).then(
          (r) => r.json()
        );
        list = (all.scores || []).slice(0, 6);
      }
    } catch {
      list = [];
    }
    setScores(list);
    if (!recap.current) {
      recap.current = true;
      await fetch('/api/chat/game', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'recap', room, kind: gameId, title, scores: list }),
      }).catch(() => {});
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameId, room, title]);

  return (
    <div className="fixed inset-0 z-[260] bg-black flex flex-col">
      <div className="flex items-center gap-3 px-3 py-2 border-b border-white/10 bg-[#12141c]">
        <div className="text-sm font-semibold truncate flex-1">{title}</div>
        <button
          type="button"
          onClick={finish}
          className="text-xs font-semibold text-black bg-emerald-400 px-3 py-1.5 rounded-full"
        >
          Exit game
        </button>
      </div>
      {scores ? (
        <div className="flex-1 overflow-y-auto p-6 max-w-md mx-auto w-full">
          <h2 className="text-lg font-semibold mb-1">Match recap</h2>
          <p className="text-xs opacity-50 mb-4">Both scores. This is also posted in the thread.</p>
          {!scores.length ? (
            <p className="text-sm opacity-50">No scores this round. Back to chat anyway.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {scores.map((s, i) => (
                <li key={i} className="flex justify-between border-b border-white/10 py-2">
                  <span>@{s.username}</span>
                  <span className="font-mono text-emerald-400">{s.score}</span>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={onExit}
            className="mt-6 font-semibold text-black bg-emerald-400 px-4 py-2 rounded-full text-sm"
          >
            Back to chat
          </button>
        </div>
      ) : (
        <iframe title={title} src={src} className="flex-1 w-full bg-black border-0" allow="autoplay" />
      )}
    </div>
  );
}
