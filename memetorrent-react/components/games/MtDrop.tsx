'use client';

import { useEffect, useRef, useState } from 'react';
import NightDesk from '@/components/games/NightDesk';
import NightWallet from '@/components/games/NightWallet';

export default function MtDrop() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const x = useRef(0.5);
  const run = useRef(true);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    let w = 0, h = 0, acc = 0, last = performance.now(), pts = 0, lives = 3;
    const bits: { x: number; y: number; v: number; k: 'mt' | 'rug' | 'tax' | 'rocket' }[] = [];
    const resize = () => {
      w = c.width = c.clientWidth * devicePixelRatio;
      h = c.height = c.clientHeight * devicePixelRatio;
    };
    resize();
    const move = (n: number) => { x.current = Math.max(0.08, Math.min(0.92, n)); };
    const onMove = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      move((e.clientX - r.left) / r.width);
    };
    c.addEventListener('pointermove', onMove);
    c.addEventListener('pointerdown', onMove);
    let spawn = 0;
    run.current = true;
    setOver(false);
    const loop = (now: number) => {
      if (!run.current) return;
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      spawn -= dt;
      if (spawn <= 0) {
        const r = Math.random();
        bits.push({
          x: 0.1 + Math.random() * 0.8,
          y: -0.05,
          v: 0.28 + Math.random() * 0.25,
          k: r < 0.55 ? 'mt' : r < 0.72 ? 'rocket' : r < 0.9 ? 'rug' : 'tax',
        });
        spawn = 0.42;
      }
      bits.forEach((b) => { b.y += b.v * dt; });
      const px = x.current;
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i];
        if (b.y > 0.88 && Math.abs(b.x - px) < 0.08) {
          if (b.k === 'mt') pts += 1;
          if (b.k === 'rocket') pts += 5;
          if (b.k === 'rug' || b.k === 'tax') lives -= 1;
          bits.splice(i, 1);
          setScore(pts);
          if (lives <= 0) {
            run.current = false;
            setOver(true);
            fetch('/api/scores', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ game_id: 'drop', score: pts }),
            }).catch(() => {});
          }
        } else if (b.y > 1.05) bits.splice(i, 1);
      }
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#07140e');
      g.addColorStop(1, '#020805');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      bits.forEach((b) => {
        const bx = b.x * w, by = b.y * h;
        ctx.font = `${28 * devicePixelRatio}px system-ui`;
        ctx.textAlign = 'center';
        ctx.fillText(b.k === 'mt' ? '🟢' : b.k === 'rocket' ? '🚀' : b.k === 'rug' ? '🧹' : '🧾', bx, by);
      });
      ctx.fillStyle = '#19d37e';
      ctx.fillRect(px * w - 28, h - 36, 56, 18);
      ctx.fillStyle = '#fff';
      ctx.font = `${14 * devicePixelRatio}px system-ui`;
      ctx.fillText('♥'.repeat(lives) + '  ' + pts, 48, 28);
      requestAnimationFrame(loop);
    };
    const id = requestAnimationFrame(loop);
    return () => {
      run.current = false;
      cancelAnimationFrame(id);
      c.removeEventListener('pointermove', onMove);
      c.removeEventListener('pointerdown', onMove);
    };
  }, [over === false ? 0 : 1]);

  return (
    <div>
      <canvas ref={ref} className="w-full h-[62vh] rounded-3xl border border-emerald-400/30 bg-black touch-none" />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">Score <span className="text-emerald-400 font-mono">{score}</span></div>
        {over && (
          <button type="button" onClick={() => { setScore(0); setOver(false); }} className="rounded-full bg-emerald-400 text-black font-bold px-4 py-2">
            Drop again
          </button>
        )}
      </div>
      <div className="mt-6 max-w-md">
        <NightWallet name="" />
      </div>
      <NightDesk />
    </div>
  );
}
