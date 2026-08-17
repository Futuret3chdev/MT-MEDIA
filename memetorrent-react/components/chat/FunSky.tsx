'use client';

import { useEffect, useRef, useState } from 'react';

export type Burst = { id: number; e: string };

export default function FunSky({ burst }: { burst: Burst | null }) {
  const [bits, setBits] = useState<{ id: number; e: string; x: number }[]>([]);
  const seen = useRef(0);
  useEffect(() => {
    if (!burst || burst.id === seen.current) return;
    seen.current = burst.id;
    const n = Array.from({ length: 5 }, (_, i) => ({
      id: burst.id * 10 + i,
      e: burst.e,
      x: 12 + i * 16 + Math.random() * 8,
    }));
    setBits(n);
    const t = setTimeout(() => setBits([]), 1600);
    return () => clearTimeout(t);
  }, [burst]);
  if (!bits.length) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {bits.map((b) => (
        <span
          key={b.id}
          className="absolute text-2xl"
          style={{
            left: `${b.x}%`,
            bottom: '8%',
            animation: 'mtFunUp 1.5s ease-out forwards',
          }}
        >
          {b.e}
        </span>
      ))}
      <style>{`@keyframes mtFunUp { from { transform: translateY(0); opacity: 1 } to { transform: translateY(-140px); opacity: 0 } }`}</style>
    </div>
  );
}
