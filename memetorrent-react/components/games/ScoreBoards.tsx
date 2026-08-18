'use client';

import { useEffect, useMemo, useState } from 'react';
import { CATALOG } from '@/lib/mt-catalog';

type Row = { username: string; score: number; created_at?: string };
type Period = 'day' | 'week' | 'month' | 'all';

const PERIODS: { id: Period; label: string }[] = [
  { id: 'day', label: 'Daily' },
  { id: 'week', label: 'Weekly' },
  { id: 'month', label: 'Monthly' },
  { id: 'all', label: 'To date' },
];

export default function ScoreBoards({ initialGame = 'tap' }: { initialGame?: string }) {
  const [game, setGame] = useState(initialGame);
  const [period, setPeriod] = useState<Period>('all');
  const [q, setQ] = useState('');
  const [typed, setTyped] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [extra, setExtra] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const titles = useMemo(() => {
    const map = new Map(CATALOG.map((g) => [g.id, g.name]));
    extra.forEach((id) => {
      if (!map.has(id)) map.set(id, id);
    });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [extra]);

  useEffect(() => {
    const t = setTimeout(() => setQ(typed.trim()), 280);
    return () => clearTimeout(t);
  }, [typed]);

  useEffect(() => {
    fetch('/api/scores?games=1')
      .then((r) => r.json())
      .then((d) => {
        const ids = (d.games || []).map((g: { game_id: string }) => g.game_id).filter(Boolean);
        setExtra(ids);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const url = `/api/scores?game_id=${encodeURIComponent(game)}&period=${period}&limit=50${
      q ? `&q=${encodeURIComponent(q)}` : ''
    }`;
    setLoading(true);
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setRows(d.scores || []);
        setTotal(Number(d.total) || 0);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [game, period, q]);

  return (
    <div className="rounded-3xl border border-white/10 bg-black/30 p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-[2px] text-emerald-400">Score boards</div>
          <h2 className="text-2xl font-semibold tracking-tight">Pick a game · pick a window</h2>
          <p className="text-sm opacity-60 mt-1">{total.toLocaleString()} players in this view</p>
        </div>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="Search a username"
          className="bg-white/5 border border-white/15 rounded-full px-4 py-2 text-sm w-full sm:w-64"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
        {titles.map(([id, name]) => (
          <button
            key={id}
            type="button"
            onClick={() => setGame(id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              game === id ? 'bg-emerald-400 text-black border-emerald-400' : 'border-white/15 opacity-80'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-5">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
              period === p.id ? 'bg-white text-black border-white' : 'border-white/15 opacity-80'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm opacity-50">Loading board…</p>}
      {!loading && !rows.length && (
        <p className="text-sm opacity-50">No scores for this game and window{q ? ` matching “${q}”` : ''}.</p>
      )}
      <ol className="space-y-1 text-sm">
        {rows.map((r, i) => (
          <li key={r.username + i} className="flex items-center justify-between gap-3 py-1.5 border-b border-white/5">
            <span className="min-w-0">
              <span className="opacity-40 mr-2">{i + 1}</span>
              <span className="font-medium">{r.username}</span>
            </span>
            <span className="font-mono text-emerald-400">{Number(r.score).toLocaleString()}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
