'use client';

import { useEffect, useState } from 'react';

export default function LiveScoreIcon({ compact = false }: { compact?: boolean }) {
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    let on = true;
    const load = () => {
      fetch('/api/scores?mine=1', { credentials: 'include' })
        .then((r) => r.json())
        .then((d) => {
          if (!on || !d.ok) return;
          const rows = (d.scores || []) as { score: number }[];
          if (rows.length) setScore(Math.max(...rows.map((r) => Number(r.score) || 0)));
        })
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 12000);
    return () => {
      on = false;
      clearInterval(t);
    };
  }, []);

  return (
    <a
      href="/boards"
      title="Leaderboard"
      aria-label="Leaderboard"
      className="inline-flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-lg border border-emerald-400/40 bg-emerald-400/10 hover:bg-emerald-400/20"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
      </span>
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-emerald-400" fill="currentColor" aria-hidden>
        <path d="M7 4h10v2h3v3c0 2.2-1.8 4-4 4h-1.1c-.5 1.2-1.5 2.1-2.9 2.4V18h3v2H9v-2h3v-2.6c-1.4-.3-2.4-1.2-2.9-2.4H8c-2.2 0-4-1.8-4-4V6h3V4zm1 4H6v1c0 1.1.9 2 2 2h.2C8.1 10.4 8 9.7 8 9V8zm8 0v1c0 .7-.1 1.4-.2 2H16c1.1 0 2-.9 2-2V8h-2z" />
      </svg>
      {!compact && (
        <span className="text-[11px] sm:text-xs font-semibold text-emerald-400 whitespace-nowrap">
          {score != null ? score.toLocaleString() : 'Board'}
        </span>
      )}
    </a>
  );
}
