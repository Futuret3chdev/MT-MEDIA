'use client';

import { useEffect, useRef, useState } from 'react';
import NightDesk from '@/components/games/NightDesk';
import NightWallet from '@/components/games/NightWallet';

type Car = { x: number; y: number; v: number; w: number };

export default function MtChicken() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [playing, setPlaying] = useState(false);
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    try { setBest(Number(localStorage.getItem('mt-chicken-best') || 0)); } catch { /* */ }
  }, []);

  useEffect(() => {
    if (!playing) return;
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    let w = 0, h = 0, dpr = 1;
    const size = () => {
      dpr = devicePixelRatio || 1;
      w = c.width = c.clientWidth * dpr;
      h = c.height = c.clientHeight * dpr;
    };
    size();
    const hen = { x: 0.5, y: 0.9 };
    const cars: Car[] = [];
    let lane = 0, dead = false, last = performance.now();
    const spawn = () => {
      for (let i = 1; i <= 8; i++) {
        cars.push({
          x: Math.random(),
          y: 0.82 - i * 0.09,
          v: (i % 2 ? 1 : -1) * (0.12 + i * 0.02),
          w: 0.08 + Math.random() * 0.04,
        });
      }
    };
    spawn();
    const down = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    addEventListener('keydown', down);
    addEventListener('keyup', up);
    const hop = (dx: number, dy: number) => {
      hen.x = Math.max(0.06, Math.min(0.94, hen.x + dx));
      hen.y = Math.max(0.06, Math.min(0.94, hen.y + dy));
      if (dy < 0) {
        lane += 1;
        setScore(lane);
      }
    };
    const ptr = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width;
      const ny = (e.clientY - r.top) / r.height;
      hop(nx - hen.x, ny < hen.y - 0.04 ? -0.09 : ny > hen.y + 0.04 ? 0.09 : 0);
    };
    c.addEventListener('pointerdown', ptr);
    let on = true;
    const loop = (now: number) => {
      if (!on || dead) return;
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (keys.current['ArrowUp'] || keys.current['KeyW']) { hop(0, -0.09); keys.current['ArrowUp'] = keys.current['KeyW'] = false; }
      if (keys.current['ArrowDown'] || keys.current['KeyS']) { hop(0, 0.09); keys.current['ArrowDown'] = keys.current['KeyS'] = false; }
      if (keys.current['ArrowLeft'] || keys.current['KeyA']) { hop(-0.08, 0); keys.current['ArrowLeft'] = keys.current['KeyA'] = false; }
      if (keys.current['ArrowRight'] || keys.current['KeyD']) { hop(0.08, 0); keys.current['ArrowRight'] = keys.current['KeyD'] = false; }
      cars.forEach((car) => {
        car.x += car.v * dt;
        if (car.x > 1.2) car.x = -0.2;
        if (car.x < -0.2) car.x = 1.2;
        if (Math.abs(car.y - hen.y) < 0.035 && Math.abs(car.x - hen.x) < car.w * 0.7) {
          dead = true;
          setPlaying(false);
          const b = Math.max(best, lane);
          setBest(b);
          try { localStorage.setItem('mt-chicken-best', String(b)); } catch { /* */ }
          fetch('/api/scores', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game_id: 'chicken', score: lane }),
          }).catch(() => {});
        }
      });
      ctx.fillStyle = '#14532d';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = i % 2 ? '#166534' : '#15803d';
        ctx.fillRect(0, (0.86 - i * 0.09) * h, w, 0.09 * h);
      }
      cars.forEach((car) => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect((car.x - car.w / 2) * w, car.y * h - 8 * dpr, car.w * w, 16 * dpr);
        ctx.fillStyle = '#19d37e';
        ctx.fillRect((car.x - car.w / 2) * w, car.y * h - 8 * dpr, 6 * dpr, 16 * dpr);
      });
      ctx.font = `${28 * dpr}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText('🐔', hen.x * w, hen.y * h);
      ctx.fillStyle = '#19d37e';
      ctx.font = `800 ${14 * dpr}px system-ui`;
      ctx.textAlign = 'left';
      ctx.fillText('LANE ' + lane, 16 * dpr, 28 * dpr);
      requestAnimationFrame(loop);
    };
    const id = requestAnimationFrame(loop);
    return () => {
      on = false;
      cancelAnimationFrame(id);
      removeEventListener('keydown', down);
      removeEventListener('keyup', up);
      c.removeEventListener('pointerdown', ptr);
    };
  }, [playing]);

  return (
    <div>
      <canvas ref={ref} className="w-full h-[58vh] rounded-3xl border border-emerald-400/30 bg-green-950 touch-none" />
      <div className="mt-3 flex justify-between text-sm">
        <span>Lane <span className="text-emerald-400 font-mono">{score}</span> · best {best}</span>
        <button type="button" onClick={() => { setScore(0); setPlaying(true); }} className="rounded-full bg-emerald-400 text-black font-bold px-5 py-2">
          {playing ? 'Crossing…' : 'Cross'}
        </button>
      </div>
      <p className="mt-2 text-xs opacity-50">WASD / tap ahead of the hen. Don’t get hit.</p>
      <div className="mt-6 max-w-md"><NightWallet name="" /></div>
      <NightDesk />
    </div>
  );
}
