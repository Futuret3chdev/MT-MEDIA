'use client';

import { useEffect, useMemo, useState } from 'react';

type Chart = {
  price: number;
  marketCap: number;
  volume: number;
  change: number;
  points: number[];
};

function money(n?: number) {
  if (!n || !Number.isFinite(n)) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n).toLocaleString()}`;
  if (n >= 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(6)}`;
}

export default function MtMiniChart() {
  const [chart, setChart] = useState<Chart | null>(null);
  useEffect(() => {
    fetch('/api/mt-chart')
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) return;
        let points = Array.isArray(d.points) ? d.points.map(Number).filter(Number.isFinite) : [];
        const price = Number(d.price) || 0;
        const change = Number(d.change) || 0;
        if (points.length < 2 && price > 0) {
          const start = price / (1 + change / 100);
          points = Array.from({ length: 16 }, (_, i) => start + ((price - start) * i) / 15);
        }
        setChart({
          price,
          marketCap: Number(d.marketCap) || 0,
          volume: Number(d.volume) || 0,
          change,
          points,
        });
      })
      .catch(() => {});
  }, []);

  const path = useMemo(() => {
    const pts = chart?.points || [];
    if (pts.length < 2) return '';
    const w = 240;
    const h = 40;
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const span = max - min || 1;
    return pts
      .map((p, i) => {
        const x = (i / (pts.length - 1)) * w;
        const y = h - ((p - min) / span) * (h - 4) - 2;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [chart]);

  const up = (chart?.change || 0) >= 0;

  return (
    <div className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-[11px]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-emerald-400 font-medium">$MT</span>
        <span className="font-mono text-emerald-400">{money(chart?.price)}</span>
        <span className={up ? 'text-emerald-400' : 'text-red-400'}>
          {up ? '+' : ''}
          {(chart?.change || 0).toFixed(1)}%
        </span>
        <span className="opacity-60 font-mono">{money(chart?.marketCap)}</span>
      </div>
      <svg viewBox="0 0 240 40" className="w-full h-8 mt-1" preserveAspectRatio="none">
        {path && <path d={path} fill="none" stroke={up ? '#34d399' : '#f87171'} strokeWidth="1.6" />}
      </svg>
    </div>
  );
}
