'use client';

import { useEffect, useRef, useState } from 'react';
import type { StudioSpec } from '@/lib/studio-spec';

type Orb = { x: number; y: number; r: number; vx: number; vy: number; bad?: boolean };

export default function GameRuntime({ spec, onScore }: { spec: StudioSpec; onScore?: (n: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState({ score: 0, lives: spec.lives, over: false, win: false });
  const specRef = useRef(spec);
  specRef.current = spec;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = canvas.width;
    let h = canvas.height;
    const keys: Record<string, boolean> = {};
    const orbs: Orb[] = [];
    const player = { x: 0.5, y: 0.82, r: 0.03 };
    let score = 0;
    let lives = specRef.current.lives;
    let over = false;
    let win = false;
    let acc = 0;
    let last = performance.now();

    const spawn = (bad = false) => {
      const s = specRef.current;
      orbs.push({
        x: 0.1 + Math.random() * 0.8,
        y: s.template === 'tap' ? 0.2 + Math.random() * 0.5 : -0.05,
        r: 0.03 + Math.random() * 0.02,
        vx: (Math.random() - 0.5) * (s.speed / 80),
        vy: s.template === 'tap' ? (Math.random() - 0.5) * (s.speed / 90) : 0.002 + s.speed / 400,
        bad,
      });
    };

    const hit = (mx: number, my: number) => {
      if (over) return;
      for (let i = orbs.length - 1; i >= 0; i--) {
        const o = orbs[i];
        const dx = mx - o.x;
        const dy = my - o.y;
        if (dx * dx + dy * dy <= o.r * o.r) {
          orbs.splice(i, 1);
          if (o.bad) {
            lives -= 1;
          } else {
            score += 1;
            onScore?.(score);
            if (score >= specRef.current.goal) {
              win = true;
              over = true;
            }
          }
          if (lives <= 0) over = true;
          setHud({ score, lives, over, win });
          return;
        }
      }
    };

    const onKey = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = e.type === 'keydown';
    };
    const onClick = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      hit((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    canvas.addEventListener('pointerdown', onClick);

    const loop = (now: number) => {
      const dt = Math.min(40, now - last);
      last = now;
      const s = specRef.current;
      if (!over) {
        acc += dt;
        const every = Math.max(180, 1400 - s.spawn * 100);
        if (acc > every) {
          acc = 0;
          spawn(s.template !== 'tap' && Math.random() < 0.28);
        }
        if (s.template !== 'tap') {
          const step = (s.speed / 400) * (dt / 16);
          if (keys['a'] || keys['arrowleft']) player.x -= step;
          if (keys['d'] || keys['arrowright']) player.x += step;
          player.x = Math.max(0.05, Math.min(0.95, player.x));
        }
        for (let i = orbs.length - 1; i >= 0; i--) {
          const o = orbs[i];
          o.x += o.vx * (dt / 16);
          o.y += o.vy * (dt / 16);
          if (s.template === 'tap') {
            if (o.x < o.r || o.x > 1 - o.r) o.vx *= -1;
            if (o.y < 0.12 || o.y > 0.88) o.vy *= -1;
          } else if (o.y > 1.1) {
            orbs.splice(i, 1);
            if (!o.bad && s.template === 'dodge') {
              /* missed a hazard is fine */
            }
            continue;
          }
          if (s.template !== 'tap') {
            const dx = player.x - o.x;
            const dy = player.y - o.y;
            if (dx * dx + dy * dy < (player.r + o.r) * (player.r + o.r)) {
              orbs.splice(i, 1);
              if (o.bad || s.template === 'dodge') {
                lives -= 1;
                if (lives <= 0) over = true;
              } else {
                score += 1;
                onScore?.(score);
                if (score >= s.goal) {
                  win = true;
                  over = true;
                }
              }
            }
          }
        }
        setHud({ score, lives, over, win });
      }

      w = canvas.width;
      h = canvas.height;
      ctx.fillStyle = s.bg;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = s.accent;
      ctx.globalAlpha = 0.12;
      ctx.fillRect(0, 0, w, 8);
      ctx.globalAlpha = 1;
      for (const o of orbs) {
        ctx.beginPath();
        ctx.arc(o.x * w, o.y * h, o.r * w, 0, Math.PI * 2);
        ctx.fillStyle = o.bad ? '#ff4d4d' : s.accent;
        ctx.fill();
      }
      if (s.template !== 'tap') {
        ctx.beginPath();
        ctx.arc(player.x * w, player.y * h, player.r * w, 0, Math.PI * 2);
        ctx.fillStyle = s.player;
        ctx.fill();
      }
      ctx.fillStyle = '#fff';
      ctx.font = '16px system-ui';
      ctx.fillText(`${s.name}  ${score}/${s.goal}  lives ${lives}`, 16, 28);
      if (over) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = s.accent;
        ctx.font = 'bold 28px system-ui';
        ctx.fillText(win ? 'YOU WIN' : 'GAME OVER', w / 2 - 80, h / 2);
      }
      raf = requestAnimationFrame(loop);
    };
    let raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      canvas.removeEventListener('pointerdown', onClick);
    };
  }, [spec.template, spec.bg, spec.accent, spec.player]);

  return (
    <div className="relative">
      <canvas ref={ref} width={720} height={420} className="w-full rounded-2xl border border-white/10 bg-black" />
      <div className="absolute top-2 right-3 text-xs opacity-70">
        {hud.over ? (hud.win ? 'Win' : 'Over') : `Score ${hud.score}`}
      </div>
    </div>
  );
}
