'use client';

import { useEffect, useState } from 'react';
import { getTokenStats } from '@/lib/api';

export default function MtMiniChart() {
  const [stats, setStats] = useState<{ price?: number; marketCap?: number; volume?: number } | null>(null);
  useEffect(() => {
    getTokenStats()
      .then((d) => {
        const n = (v: string | undefined) => {
          const x = Number(v);
          return Number.isFinite(x) ? x : 0;
        };
        setStats({
          price: n(d.price),
          marketCap: n(d.market_cap || d.fdv),
          volume: n(d.total_buy_volume) + n(d.total_sell_volume),
        });
      })
      .catch(() => setStats({ price: 0, marketCap: 0, volume: 0 }));
  }, []);
  const fmt = (n?: number) =>
    !n
      ? '—'
      : n >= 1_000_000
        ? `$${(n / 1_000_000).toFixed(2)}M`
        : n >= 1
          ? `$${n.toFixed(4)}`
          : `$${n.toFixed(8)}`;
  return (
    <div className="rounded-xl border border-emerald-400/30 bg-black/50 p-3 text-xs">
      <div className="text-[10px] uppercase tracking-wider text-emerald-400 mb-1">MT chart</div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <div className="opacity-50">Price</div>
          <div className="font-mono text-emerald-400">{fmt(stats?.price)}</div>
        </div>
        <div>
          <div className="opacity-50">MCap</div>
          <div className="font-mono">{fmt(stats?.marketCap)}</div>
        </div>
        <div>
          <div className="opacity-50">24h</div>
          <div className="font-mono">{fmt(stats?.volume)}</div>
        </div>
      </div>
      <a href="/#stats" className="inline-block mt-2 text-emerald-400">
        Open full chart →
      </a>
    </div>
  );
}
