'use client';

import { useEffect, useRef, useState } from 'react';
import NightDesk from '@/components/games/NightDesk';
import NightWallet from '@/components/games/NightWallet';

type Car = { x: number; y: number; v: number; w: number; kind: 'car' | 'truck' };

export default function MtChicken() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [lives, setLives] = useState(3);
  const [shield, setShield] = useState(false);
  const [night, setNight] = useState(false);
  const keys = useRef<Record<string, boolean>>({});
  const stopRef = useRef(false);

  useEffect(() => {
    try { setBest(Number(localStorage.getItem('mt-chicken-best') || 0)); } catch { /* */ }
  }, []);

  useEffect(() => {
    if (!playing) return;
    stopRef.current = false;
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
    const loot: { x: number; y: number; k: 'mt' | 'shield' }[] = [];
    let lane = 0, hp = 3, sh = false, coins = 0, dead = false, last = performance.now();
    setLives(3); setShield(false);
    const spawn = () => {
      cars.length = 0;
      loot.length = 0;
      for (let i = 1; i <= 8; i++) {
        const truck = i % 3 === 0;
        cars.push({
          x: Math.random(),
          y: 0.82 - i * 0.09,
          v: (i % 2 ? 1 : -1) * (truck ? 0.08 : 0.13 + i * 0.022),
          w: truck ? 0.16 : 0.08 + Math.random() * 0.04,
          kind: truck ? 'truck' : 'car',
        });
        if (Math.random() < 0.5) loot.push({ x: 0.2 + Math.random() * 0.6, y: 0.82 - i * 0.09, k: Math.random() < 0.25 ? 'shield' : 'mt' });
      }
    };
    spawn();
    const down = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    addEventListener('keydown', down);
    addEventListener('keyup', up);
    const hop = (dx: number, dy: number) => {
      hen.x = Math.max(0.06, Math.min(0.94, hen.x + dx));
      hen.y = Math.max(0.04, Math.min(0.94, hen.y + dy));
      if (dy < 0) {
        lane += 1;
        setScore(lane);
      }
      if (hen.y < 0.08) {
        hen.y = 0.9;
        coins += 3;
        lane += 2;
        setScore(lane);
        spawn();
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
      if (!on || dead || stopRef.current) return;
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
        car.v *= 1 + lane * 0.0004;
        if (Math.abs(car.y - hen.y) < 0.035 && Math.abs(car.x - hen.x) < car.w * 0.7) {
          if (sh) { sh = false; setShield(false); car.x = -0.3; }
          else {
            hp -= 1; setLives(hp);
            hen.x = 0.5; hen.y = Math.min(0.9, hen.y + 0.09);
            if (hp <= 0) {
              dead = true;
              setPlaying(false);
              const b = Math.max(best, lane + coins * 5);
              setBest(b);
              try { localStorage.setItem('mt-chicken-best', String(b)); } catch { /* */ }
              fetch('/api/scores', {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ game_id: 'chicken', score: lane + coins * 5 }),
              }).catch(() => {});
            }
          }
        }
      });
      loot.forEach((c) => {
        if (Math.hypot(c.x - hen.x, c.y - hen.y) < 0.05) {
          if (c.k === 'mt') coins += 1;
          if (c.k === 'shield') { sh = true; setShield(true); }
          c.y = -1;
        }
      });
      ctx.fillStyle = night ? '#052e16' : '#14532d';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = i % 2 ? '#166534' : '#15803d';
        ctx.fillRect(0, (0.86 - i * 0.09) * h, w, 0.09 * h);
      }
      cars.forEach((car) => {
        ctx.fillStyle = car.kind === 'truck' ? '#7f1d1d' : '#0f172a';
        ctx.fillRect((car.x - car.w / 2) * w, car.y * h - (car.kind === 'truck' ? 11 : 8) * dpr, car.w * w, (car.kind === 'truck' ? 22 : 16) * dpr);
        ctx.fillStyle = '#19d37e';
        ctx.fillRect((car.x - car.w / 2) * w, car.y * h - 8 * dpr, 6 * dpr, 16 * dpr);
      });
      ctx.font = `${28 * dpr}px system-ui`;
      ctx.textAlign = 'center';
      loot.forEach((c) => {
        if (c.y < 0) return;
        ctx.font = `${18 * dpr}px system-ui`;
        ctx.fillText(c.k === 'shield' ? '🛡' : '🟢', c.x * w, c.y * h);
      });
      ctx.font = `${28 * dpr}px system-ui`;
      ctx.fillText('🐔', hen.x * w, hen.y * h);
      if (sh) {
        ctx.strokeStyle = '#19d37e';
        ctx.lineWidth = 3 * dpr;
        ctx.beginPath(); ctx.arc(hen.x * w, hen.y * h - 8 * dpr, 20 * dpr, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = '#19d37e';
      ctx.font = `800 ${14 * dpr}px system-ui`;
      ctx.textAlign = 'left';
      ctx.fillText('LANE ' + lane + '  🟢' + coins + '  ' + '♥'.repeat(hp), 16 * dpr, 28 * dpr);
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
        <span>Lane <span className="text-emerald-400 font-mono">{score}</span> · best {best} {shield ? '· 🛡' : ''} · {'♥'.repeat(lives)}</span>
        <div className="flex gap-2">
          <button type="button" onClick={() => setNight((v) => !v)} className="rounded-full border border-white/20 px-3 py-2 text-xs">
            {night ? 'Day' : 'Night'}
          </button>
          {playing && (
            <button type="button" onClick={() => { stopRef.current = true; setPlaying(false); }} className="rounded-full border border-white/20 px-4 py-2">
              Stop
            </button>
          )}
          <button type="button" onClick={() => { setScore(0); setLives(3); setPlaying(true); }} className="rounded-full bg-emerald-400 text-black font-bold px-5 py-2">
            {playing ? 'Crossing…' : 'Cross'}
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs opacity-50">3 lives. 🟢 $MT. 🛡 shield. Night/Day. Trucks. Far sidewalk wraps + bonus. Cars speed up each lane.</p>
      <div className="mt-6 max-w-md"><NightWallet name="" /></div>
      <NightDesk />
    </div>
  );
}
