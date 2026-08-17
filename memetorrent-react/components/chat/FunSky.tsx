'use client';

import { useEffect, useState } from 'react';

export type Burst = { id: number; e: string };

export default function FunSky({ burst }: { burst: Burst | null }) {
  const [bits, setBits] = useState<{ id: number; e: string; x: number }[]>([]);
  useEffect(() => {
    if (!burst) return;
    const n = Array.from({ length: 14 }, (_, i) => ({
      id: burst.id + i,
      e: burst.e,
      x: 8 + Math.random() * 84,
    }));
    setBits((b) => [...b, ...n]);
    const t = setTimeout(() => {
      setBits((b) => b.filter((x) => x.id < burst.id || x.id > burst.id + 20));
    }, 2400);
    return () => clearTimeout(t);
  }, [burst]);
  if (!bits.length) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[230] overflow-hidden">
      {bits.map((b) => (
        <span
          key={b.id}
          className="absolute text-3xl animate-bounce"
          style={{ left: `${b.x}%`, bottom: '12%', animationDuration: '1.4s' }}
        >
          {b.e}
        </span>
      ))}
    </div>
  );
}
