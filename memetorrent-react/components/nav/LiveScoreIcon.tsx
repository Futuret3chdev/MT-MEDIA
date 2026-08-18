'use client';

import { useEffect, useState } from 'react';

export default function LiveScoreIcon() {
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    let on = true;
    const load = () => {
      fetch('/api/scores?mine=1', { credentials: 'include' })
        .then((r) => r.json())
        .then((d) => {
          if (!on) return;
          const rows = (d.scores || []) as { score: number }[];
          if (!rows.length) {
            setScore(null);
            return;
          }
          setScore(Math.max(...rows.map((r) => Number(r.score) || 0)));
        })
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 8000);
    return () => {
      on = false;
      clearInterval(t);
    };
  }, []);

  return (
    <a
      href="/boards"
      title="Live scores"
      aria-label="Live scores"
      className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-lg border border-emerald-400/35 bg-emerald-400/10 hover:bg-emerald-400/20"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
      </span>
      <span className="text-[11px] sm:text-xs font-semibold text-emerald-400 whitespace-nowrap">
        {score != null ? score.toLocaleString() : 'Scores'}
      </span>
    </a>
  );
}
