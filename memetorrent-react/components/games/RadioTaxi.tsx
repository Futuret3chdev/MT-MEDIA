'use client';

import { useEffect, useRef, useState } from 'react';

const STOPS = [
  { name: 'Gallery', x: 0.78, y: 0.42, c: '#f4f1ea' },
  { name: 'Studio', x: 0.2, y: 0.4, c: '#b07a43' },
  { name: 'Museum', x: 0.5, y: 0.18, c: '#9aa3ad' },
  { name: 'Casino', x: 0.5, y: 0.78, c: '#19d37e' },
];

export default function RadioTaxi({ embed = false }: { embed?: boolean }) {
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
    const ptr = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - car.x;
      const ny = (e.clientY - r.top) / r.height - car.y;
      car.a = Math.atan2(nx, -ny);
      keys.current['KeyW'] = true;
    };
    const pup = () => { keys.current['KeyW'] = false; };
    c.addEventListener('pointerdown', ptr);
    c.addEventListener('pointermove', (e) => { if (e.buttons) ptr(e); });
    c.addEventListener('pointerup', pup);
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
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#1b3a4a');
      sky.addColorStop(0.45, '#0f241c');
      sky.addColorStop(1, '#0a1610');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#16301f';
      ctx.fillRect(0, h * 0.52, w, h * 0.48);
      ctx.strokeStyle = '#2a5a38';
      ctx.lineWidth = Math.max(28, w * 0.08);
      ctx.beginPath(); ctx.moveTo(w * 0.5, 0); ctx.lineTo(w * 0.5, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, h * 0.5); ctx.lineTo(w, h * 0.5); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,180,0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 14]);
      ctx.beginPath(); ctx.moveTo(w * 0.5, 0); ctx.lineTo(w * 0.5, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, h * 0.5); ctx.lineTo(w, h * 0.5); ctx.stroke();
      ctx.setLineDash([]);
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
      ctx.fillStyle = '#f4c430';
      ctx.fillRect(-12, -18, 24, 34);
      ctx.fillStyle = '#111';
      ctx.fillRect(-8, -8, 7, 7);
      ctx.fillRect(1, -8, 7, 7);
      ctx.restore();
      requestAnimationFrame(loop);
    };
    const id = requestAnimationFrame(loop);
    return () => {
      on = false;
      cancelAnimationFrame(id);
      removeEventListener('keydown', down);
      removeEventListener('keyup', up);
      c.removeEventListener('pointerdown', ptr);
      c.removeEventListener('pointerup', pup);
    };
  }, []);

  return (
    <div className={embed ? 'h-full w-full min-h-0 flex flex-col bg-[#0a1610]' : ''}>
      <canvas ref={ref} className={embed ? 'flex-1 min-h-0 w-full touch-none' : 'w-full h-[58vh] rounded-3xl border border-amber-400/30 bg-black touch-none'} />
      <p className={`text-sm ${embed ? 'px-3 py-2 shrink-0' : 'mt-2'}`}>
        Drag to drive · WASD · fares <span className="text-amber-300 font-mono">{fare}</span>
      </p>
    </div>
  );
}
