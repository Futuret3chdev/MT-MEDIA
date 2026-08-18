'use client';

import { useEffect, useRef, useState } from 'react';
import NightDesk from '@/components/games/NightDesk';
import NightWallet from '@/components/games/NightWallet';

const STOPS = [
  { name: 'Gallery', x: 0.78, y: 0.42, c: '#f4f1ea' },
  { name: 'Studio', x: 0.2, y: 0.4, c: '#b07a43' },
  { name: 'Museum', x: 0.5, y: 0.18, c: '#9aa3ad' },
  { name: 'Casino', x: 0.5, y: 0.78, c: '#19d37e' },
];

export default function RadioTaxi() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [fare, setFare] = useState(0);
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    let w = 0, h = 0;
    const car = { x: 0.5, y: 0.55, a: 0 };
    let rider: { tx: number; ty: number; dest: number } | null = null;
    let pts = 0;
    const resize = () => {
      w = c.width = c.clientWidth * devicePixelRatio;
      h = c.height = c.clientHeight * devicePixelRatio;
    };
    resize();
    const down = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    addEventListener('keydown', down);
    addEventListener('keyup', up);
    let last = performance.now();
    let on = true;
    const loop = (now: number) => {
      if (!on) return;
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      if (keys.current['KeyA'] || keys.current['ArrowLeft']) car.a -= 2.6 * dt;
      if (keys.current['KeyD'] || keys.current['ArrowRight']) car.a += 2.6 * dt;
      const go = keys.current['KeyW'] || keys.current['ArrowUp'] ? 1 : keys.current['KeyS'] || keys.current['ArrowDown'] ? -0.5 : 0;
      car.x += Math.sin(car.a) * go * 0.35 * dt;
      car.y -= Math.cos(car.a) * go * 0.35 * dt;
      car.x = Math.max(0.06, Math.min(0.94, car.x));
      car.y = Math.max(0.06, Math.min(0.94, car.y));
      if (!rider && Math.random() < 0.01) {
        const dest = Math.floor(Math.random() * STOPS.length);
        rider = { tx: 0.2 + Math.random() * 0.6, ty: 0.2 + Math.random() * 0.6, dest };
      }
      if (rider && !('held' in rider) && Math.hypot(car.x - rider.tx, car.y - rider.ty) < 0.05) {
        (rider as { held?: boolean }).held = true;
      }
      if (rider && (rider as { held?: boolean }).held) {
        const s = STOPS[rider.dest];
        if (Math.hypot(car.x - s.x, car.y - s.y) < 0.06) {
          pts += 1;
          setFare(pts);
          rider = null;
          fetch('/api/scores', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game_id: 'taxi', score: pts }),
          }).catch(() => {});
        }
      }
      ctx.fillStyle = '#0b1610';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#14532d';
      ctx.lineWidth = 40;
      ctx.beginPath(); ctx.moveTo(w * 0.5, 0); ctx.lineTo(w * 0.5, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, h * 0.5); ctx.lineTo(w, h * 0.5); ctx.stroke();
      STOPS.forEach((s) => {
        ctx.fillStyle = s.c;
        ctx.fillRect(s.x * w - 22, s.y * h - 22, 44, 44);
        ctx.fillStyle = '#000';
        ctx.font = `${10 * devicePixelRatio}px system-ui`;
        ctx.fillText(s.name, s.x * w - 20, s.y * h + 4);
      });
      if (rider) {
        ctx.fillStyle = (rider as { held?: boolean }).held ? '#19d37e' : '#fbbf24';
        ctx.beginPath();
        ctx.arc(((rider as { held?: boolean }).held ? car.x : rider.tx) * w, ((rider as { held?: boolean }).held ? car.y - 0.04 : rider.ty) * h, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.save();
      ctx.translate(car.x * w, car.y * h);
      ctx.rotate(car.a);
      ctx.fillStyle = '#19d37e';
      ctx.fillRect(-10, -16, 20, 32);
      ctx.restore();
      requestAnimationFrame(loop);
    };
    const id = requestAnimationFrame(loop);
    return () => {
      on = false;
      cancelAnimationFrame(id);
      removeEventListener('keydown', down);
      removeEventListener('keyup', up);
    };
  }, []);

  return (
    <div>
      <canvas ref={ref} className="w-full h-[58vh] rounded-3xl border border-emerald-400/30 bg-black" />
      <p className="mt-2 text-sm">WASD / arrows · fares <span className="text-emerald-400 font-mono">{fare}</span></p>
      <div className="mt-6 max-w-md">
        <NightWallet name="" />
      </div>
      <NightDesk />
    </div>
  );
}
