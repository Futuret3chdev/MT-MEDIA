'use client';

import { useEffect, useState } from 'react';

type Group = {
  game_id: string;
  title: string;
  matches: { id: number; scores: { username: string; score: number }[]; created_at: string }[];
};

export default function GameScores({ room, onClose }: { room: string; onClose: () => void }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/chat/game?room=${encodeURIComponent(room)}&archive=1`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setGroups(d.archive || []))
      .catch(() => setGroups([]));
  }, [room]);

  return (
    <div className="fixed inset-0 z-[250] bg-black/70 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#12141c] p-4">
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="font-semibold">Group scores</div>
            <div className="text-[11px] opacity-50">Archives by game for this room</div>
          </div>
          <button type="button" className="text-xs opacity-60" onClick={onClose}>
            Close
          </button>
        </div>
        {!groups.length && <p className="text-sm opacity-50">No saved matches yet. Exit and save a game first.</p>}
        <div className="space-y-2">
          {groups.map((g) => (
            <div key={g.game_id} className="rounded-xl border border-white/10">
              <button
                type="button"
                className="w-full text-left px-3 py-2 flex justify-between"
                onClick={() => setOpenId((id) => (id === g.game_id ? null : g.game_id))}
              >
                <span className="text-sm font-medium">{g.title}</span>
                <span className="text-[11px] opacity-50">{g.matches.length} match{g.matches.length === 1 ? '' : 'es'}</span>
              </button>
              {openId === g.game_id && (
                <ul className="px-3 pb-3 space-y-2">
                  {g.matches.map((m) => (
                    <li key={m.id} className="text-xs border-t border-white/10 pt-2">
                      <div className="opacity-40 mb-1">{new Date(m.created_at).toLocaleString()}</div>
                      {m.scores.map((s, i) => (
                        <div key={i} className="flex justify-between">
                          <span>@{s.username}</span>
                          <span className="font-mono text-emerald-400">{s.score}</span>
                        </div>
                      ))}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
