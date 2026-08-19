'use client';

import { useEffect, useState } from 'react';
import NightDesk from '@/components/games/NightDesk';
import NightWallet from '@/components/games/NightWallet';

export default function MtPac() {
  const [last, setLast] = useState(0);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (!d || d.type !== 'mt-pac-score') return;
      const n = Number(d.score) || 0;
      setLast(n);
    };
    addEventListener('message', onMsg);
    return () => removeEventListener('message', onMsg);
  }, []);

  return (
    <div>
      <iframe
        src="/games/unix/1/index.html"
        title="MT Pac"
        className="block w-full rounded-3xl border border-emerald-400/30 bg-black"
        style={{ height: 'min(78vh, 760px)', minHeight: 560 }}
        allow="autoplay; fullscreen"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>
          Last run <span className="text-emerald-400 font-mono">{last}</span>
        </span>
        <p className="text-xs opacity-50">
          Menu: Pac-Man, Ms. Pac-Man, Cookie-Man, Crazy Otto, $MT Pac, Learn. Then Play / Turbo / $MT / Practice / Cutscenes / About / High scores. Esc = in-game menu.
        </p>
      </div>
      <div className="mt-6 max-w-md mx-auto"><NightWallet name="" /></div>
      <NightDesk />
    </div>
  );
}
