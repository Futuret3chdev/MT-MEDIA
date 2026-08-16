'use client';

import { useEffect, useState } from 'react';

type Row = { username: string; score: number };

export default function TapBoard() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    fetch('/api/scores?game_id=tap')
      .then((r) => r.json())
      .then((d) => setRows(d.scores || []))
      .catch(() => {});
  }, []);
  if (!rows.length) return null;
  return (
    <div className="mt-12 rounded-2xl border border-white/10 p-5">
      <h2 className="font-semibold mb-3">Tap Tap board</h2>
      <ol className="text-sm space-y-1">
        {rows.slice(0, 10).map((r, i) => (
          <li key={i} className="flex justify-between">
            <span>
              {i + 1}. {r.username}
            </span>
            <span className="font-mono text-emerald-400">{r.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
