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
  const [boostLeft, setBoostLeft] = useState(0);
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
    const loot: { x: number; y: number; k: 'mt' | 'rug' | 'special' }[] = [];
    let jumpBoost = 0;
    const JUMP = -0.72;
    const JUMP_BOOST = -1.05;
    const seed = () => {
      pads.length = 0;
      loot.length = 0;
      let x = 0.42;
      for (let i = 0; i < 16; i++) {
        x = Math.max(0.06, Math.min(0.76, x + (Math.random() - 0.5) * 0.28));
        pads.push({ x, y: 0.92 - i * 0.075, w: 0.18, kind: 'solid' });
      }
    };
    seed();
    const spawnAbove = (top: number) => {
      while (pads[pads.length - 1].y > top - 1.6) {
        const prev = pads[pads.length - 1];
        const r = Math.random();
        const gap = 0.065 + Math.random() * 0.03;
        let nx = prev.x + (Math.random() - 0.5) * 0.26;
        nx = Math.max(0.05, Math.min(0.77, nx));
        pads.push({
          x: nx,
          y: prev.y - gap,
          w: 0.17 + Math.random() * 0.03,
          kind: r > 0.88 ? 'boost' : r > 0.74 ? 'break' : r > 0.58 ? 'move' : 'solid',
        });
        if (Math.random() < 0.42) {
          const roll = Math.random();
          loot.push({
            x: nx + 0.06,
            y: prev.y - gap - 0.045,
            k: roll < 0.14 ? 'special' : roll < 0.28 ? 'rug' : 'mt',
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
        if (p.vy > 0 && p.y < pad.y + 0.012 && p.y > pad.y - 0.035 && p.x > pad.x - 0.025 && p.x < pad.x + pad.w + 0.025) {
          if (pad.kind === 'break') pad.y = 2;
          const spring = jumpBoost > 0 ? JUMP_BOOST : JUMP;
          p.vy = pad.kind === 'boost' ? JUMP_BOOST : spring;
        }
      });
      loot.forEach((c) => {
        if (Math.hypot(p.x - c.x, p.y - c.y) < 0.05) {
          if (c.k === 'mt') { pts += 25; coins += 1; }
          if (c.k === 'special') {
            pts += 80;
            coins += 5;
            jumpBoost = 10;
          }
          if (c.k === 'rug') p.vy = 0.7;
          c.y = 3;
        }
      });
      if (jumpBoost > 0) {
        jumpBoost = Math.max(0, jumpBoost - dt);
        setBoostLeft(Math.ceil(jumpBoost));
      } else {
        setBoostLeft(0);
      }
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
        ctx.font = `${(c.k === 'special' ? 30 : 22) * dpr}px system-ui`;
        ctx.textAlign = 'center';
        ctx.fillText(c.k === 'special' ? '💰' : c.k === 'mt' ? '🟢' : '🧹', c.x * w, c.y * h);
      });
      if (jumpBoost > 0) {
        ctx.strokeStyle = 'rgba(25,211,126,0.85)';
        ctx.lineWidth = 4 * dpr;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, 22 * dpr, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = jumpBoost > 0 ? '#19d37e' : '#ffe566';
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
      ctx.fillText(`${pts}   🟢${coins}${jumpBoost > 0 ? '   $MT BOOST ' + Math.ceil(jumpBoost) + 's' : ''}`, 16 * dpr, 28 * dpr);
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
          {boostLeft > 0 && (
            <span className="ml-3 font-black text-emerald-400">$MT BOOST {boostLeft}s</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => { setOver(false); setScore(0); setPlaying(true); }}
          className="rounded-full bg-emerald-400 text-black font-bold px-5 py-2"
        >
          {playing ? 'Dashing…' : over ? 'Dash again' : 'Start dash'}
        </button>
      </div>
      <p className="mt-2 text-xs opacity-50">A/D or drag. Pads stay in jump range. 💰 $MT stash = 10s jump boost. 🟢 coins · 🧹 rugs.</p>
      <div className="mt-6 max-w-md">
        <NightWallet name="" />
      </div>
      <NightDesk />
    </div>
  );
}
