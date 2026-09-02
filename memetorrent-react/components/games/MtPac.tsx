'use client';

import { useEffect, useState } from 'react';

export default function MtPac({ embed = false }: { embed?: boolean }) {
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
    <div className={embed ? 'h-full w-full bg-black' : ''}>
      <iframe
        src="/games/unix/1/index.html"
        title="MT Pac"
        className="block w-full bg-black"
        style={embed ? { height: '100%', minHeight: 0, border: 0 } : { height: 'min(78vh, 760px)', minHeight: 560, borderRadius: 24, border: '1px solid rgba(25,211,126,.3)' }}
        allow="autoplay; fullscreen; gamepad"
      />
      {!embed && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>
            Last run <span className="text-emerald-400 font-mono">{last}</span>
          </span>
        </div>
      )}
    </div>
  );
}
