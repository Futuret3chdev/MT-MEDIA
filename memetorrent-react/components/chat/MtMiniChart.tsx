'use client';

import { useEffect, useMemo, useState } from 'react';

type Chart = {
  price: number;
  marketCap: number;
  volume: number;
  change: number;
  points: number[];
  embed?: string;
};

function money(n?: number, digits = 2) {
  if (!n || !Number.isFinite(n)) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(digits)}M`;
  if (n >= 1_000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(8)}`;
}

export default function MtMiniChart() {
  const [chart, setChart] = useState<Chart | null>(null);
  useEffect(() => {
    fetch('/api/mt-chart')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setChart({
            price: Number(d.price) || 0,
            marketCap: Number(d.marketCap) || 0,
            volume: Number(d.volume) || 0,
            change: Number(d.change) || 0,
            points: Array.isArray(d.points) ? d.points.map(Number).filter(Number.isFinite) : [],
            embed: d.embed,
          });
        }
      })
      .catch(() => {});
  }, []);

  const path = useMemo(() => {
    const pts = chart?.points || [];
    if (pts.length < 2) return '';
    const w = 280;
    const h = 72;
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const span = max - min || 1;
    return pts
      .map((p, i) => {
        const x = (i / (pts.length - 1)) * w;
        const y = h - ((p - min) / span) * (h - 6) - 3;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [chart]);

  const up = (chart?.change || 0) >= 0;

  return (
    <div className="rounded-xl border border-emerald-400/30 bg-black/60 p-3 text-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-wider text-emerald-400">$MT chart</div>
        <div className={up ? 'text-emerald-400' : 'text-red-400'}>
          {up ? '+' : ''}
          {(chart?.change || 0).toFixed(2)}%
        </div>
      </div>
      {chart?.embed ? (
        <iframe
          title="$MT chart"
          src={chart.embed}
          className="w-full h-44 rounded-lg mb-2 border-0 bg-black"
        />
      ) : (
        <svg viewBox="0 0 280 72" className="w-full h-16 mb-2" preserveAspectRatio="none">
          {path && (
            <>
              <path d={path} fill="none" stroke={up ? '#34d399' : '#f87171'} strokeWidth="2" />
              <path
                d={`${path} L280,72 L0,72 Z`}
                fill={up ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)'}
              />
            </>
          )}
        </svg>
      )}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <div className="opacity-50">Price</div>
          <div className="font-mono text-emerald-400">{money(chart?.price, 8)}</div>
        </div>
        <div>
          <div className="opacity-50">MCap</div>
          <div className="font-mono">{money(chart?.marketCap)}</div>
        </div>
        <div>
          <div className="opacity-50">24h vol</div>
          <div className="font-mono">{money(chart?.volume)}</div>
        </div>
      </div>
      <a href="/#stats" className="inline-block mt-2 text-emerald-400">
        Open full chart →
      </a>
    </div>
  );
}
