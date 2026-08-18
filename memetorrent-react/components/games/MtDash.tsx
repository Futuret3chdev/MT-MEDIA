'use client';

import { useEffect, useRef, useState } from 'react';
import NightDesk from '@/components/games/NightDesk';
import NightWallet from '@/components/games/NightWallet';

type Pad = { x: number; y: number; w: number; kind: 'solid' | 'break' | 'move' | 'boost' };

export default function MtDash() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);
  const [playing, setPlaying] = useState(false);
  const keys = useRef({ l: false, r: false });
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    try { setBest(Number(localStorage.getItem('mt-dash-best') || 0)); } catch { /* */ }
  }, []);

  useEffect(() => {
    if (!playing) return;
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    let w = 0, h = 0, dpr = devicePixelRatio || 1;
    const resize = () => {
      dpr = devicePixelRatio || 1;
      w = c.width = c.clientWidth * dpr;
      h = c.height = c.clientHeight * dpr;
    };
    resize();
    const p = { x: 0.5, y: 0.7, vx: 0, vy: -0.55 };
    let cam = 0;
    let pts = 0;
    let coins = 0;
    let dead = false;
    const pads: Pad[] = [];
    const loot: { x: number; y: number; k: 'mt' | 'rug' }[] = [];
    const seed = () => {
      pads.length = 0;
      loot.length = 0;
      for (let i = 0; i < 14; i++) {
        pads.push({
          x: 0.08 + Math.random() * 0.72,
          y: 0.95 - i * 0.12,
          w: 0.16,
          kind: 'solid',
        });
      }
    };
    seed();
    const spawnAbove = (top: number) => {
      while (pads[pads.length - 1].y > top - 1.6) {
        const last = pads[pads.length - 1].y;
        const r = Math.random();
        pads.push({
          x: 0.06 + Math.random() * 0.74,
          y: last - (0.1 + Math.random() * 0.08),
          w: 0.14 + Math.random() * 0.05,
          kind: r > 0.82 ? 'boost' : r > 0.64 ? 'break' : r > 0.48 ? 'move' : 'solid',
        });
        if (Math.random() < 0.35) {
          loot.push({
            x: pads[pads.length - 1].x + 0.05,
            y: pads[pads.length - 1].y - 0.04,
            k: Math.random() < 0.18 ? 'rug' : 'mt',
          });
        }
      }
    };
    const down = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.current.l = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.current.r = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.current.l = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.current.r = false;
    };
    const ptr = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      touchX.current = (e.clientX - r.left) / r.width;
    };
    addEventListener('keydown', down);
    addEventListener('keyup', up);
    c.addEventListener('pointerdown', ptr);
    c.addEventListener('pointermove', ptr);
    c.addEventListener('pointerup', () => { touchX.current = null; });
    let last = performance.now();
    let on = true;
    const loop = (now: number) => {
      if (!on) return;
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (keys.current.l) p.vx -= 1.8 * dt;
      if (keys.current.r) p.vx += 1.8 * dt;
      if (touchX.current != null) p.vx += (touchX.current - p.x) * 8 * dt;
      p.vx *= 0.9;
      p.vy += 1.15 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 0) p.x += 1;
      if (p.x > 1) p.x -= 1;
      pads.forEach((pad) => {
        if (pad.kind === 'move') pad.x = 0.1 + (Math.sin(now / 500 + pad.y * 8) * 0.5 + 0.5) * 0.7;
        if (p.vy > 0 && p.y < pad.y + 0.01 && p.y > pad.y - 0.03 && p.x > pad.x - 0.02 && p.x < pad.x + pad.w + 0.02) {
          if (pad.kind === 'break') pad.y = 2;
          p.vy = pad.kind === 'boost' ? -1.05 : -0.58;
        }
      });
      loot.forEach((c) => {
        if (Math.hypot(p.x - c.x, p.y - c.y) < 0.045) {
          if (c.k === 'mt') { pts += 25; coins += 1; }
          if (c.k === 'rug') p.vy = 0.85;
          c.y = 3;
        }
      });
      if (p.y < 0.45) {
        const lift = 0.45 - p.y;
        p.y = 0.45;
        cam += lift;
        pads.forEach((pad) => { pad.y += lift; });
        loot.forEach((c) => { c.y += lift; });
        pts += Math.floor(lift * 80);
        setScore(pts);
      }
      spawnAbove(Math.min(...pads.map((p) => p.y)));
      if (p.y > 1.12 && !dead) {
        dead = true;
        on = false;
        setOver(true);
        setPlaying(false);
        setScore(pts);
        const b = Math.max(best, pts);
        setBest(b);
        try { localStorage.setItem('mt-dash-best', String(b)); } catch { /* */ }
        fetch('/api/scores', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ game_id: 'dash', score: pts }),
        }).catch(() => {});
      }
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#04110c');
      sky.addColorStop(1, '#0b2a1c');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(25,211,126,0.06)';
      for (let i = 0; i < 8; i++) ctx.fillRect((i / 8) * w, 0, 2, h);
      pads.forEach((pad) => {
        ctx.fillStyle = pad.kind === 'boost' ? '#fbbf24' : pad.kind === 'break' ? '#fb7185' : pad.kind === 'move' ? '#38bdf8' : '#19d37e';
        ctx.fillRect(pad.x * w, pad.y * h, pad.w * w, 10 * dpr);
      });
      loot.forEach((c) => {
        ctx.font = `${22 * dpr}px system-ui`;
        ctx.textAlign = 'center';
        ctx.fillText(c.k === 'mt' ? '🟢' : '🧹', c.x * w, c.y * h);
      });
      ctx.fillStyle = '#ffe566';
      ctx.beginPath();
      ctx.ellipse(p.x * w, p.y * h, 16 * dpr, 14 * dpr, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(p.x * w - 4 * dpr, p.y * h - 2 * dpr, 2 * dpr, 0, Math.PI * 2);
      ctx.arc(p.x * w + 5 * dpr, p.y * h - 2 * dpr, 2 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#19d37e';
      ctx.font = `${14 * dpr}px system-ui`;
      ctx.textAlign = 'left';
      ctx.fillText(`${pts}   🟢${coins}`, 16 * dpr, 28 * dpr);
      requestAnimationFrame(loop);
    };
    const id = requestAnimationFrame(loop);
    return () => {
      on = false;
      cancelAnimationFrame(id);
      removeEventListener('keydown', down);
      removeEventListener('keyup', up);
    };
  }, [playing]);

  return (
    <div>
      <canvas ref={ref} className="w-full h-[64vh] rounded-3xl border border-emerald-400/30 bg-black touch-none" />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div>
          Score <span className="text-emerald-400 font-mono">{score}</span>
          <span className="opacity-50 ml-3">best {best}</span>
        </div>
        <button
          type="button"
          onClick={() => { setOver(false); setScore(0); setPlaying(true); }}
          className="rounded-full bg-emerald-400 text-black font-bold px-5 py-2"
        >
          {playing ? 'Dashing…' : over ? 'Dash again' : 'Start dash'}
        </button>
      </div>
      <p className="mt-2 text-xs opacity-50">A/D or arrows, or drag. Green pads bounce. Gold boosts. Pink breaks. 🟢 coins · 🧹 rugs.</p>
      <div className="mt-6 max-w-md">
        <NightWallet name="" />
      </div>
      <NightDesk />
    </div>
  );
}
