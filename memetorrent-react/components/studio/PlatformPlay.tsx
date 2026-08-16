'use client';

import { useEffect, useRef, useState } from 'react';
import { TILE, THEMES, getTile, type MapSpec } from '@/lib/studio-map';

const TS = 28;

export default function PlatformPlay({ spec }: { spec: MapSpec }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState('Arrow keys / WASD · space jump');

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const th = THEMES[spec.theme];
    const keys: Record<string, boolean> = {};
    let spawn = { x: TS, y: TS };
    for (let y = 0; y < spec.rows; y++) {
      for (let x = 0; x < spec.cols; x++) {
        if (getTile(spec, x, y) === TILE.spawn) spawn = { x: x * TS + 4, y: y * TS - 8 };
      }
    }
    const p = { x: spawn.x, y: spawn.y, vx: 0, vy: 0, w: 18, h: 22, on: false };
    const enemies: { x: number; y: number; dir: number; dead: boolean }[] = [];
    const gone = new Set<string>();
    let coins = 0;
    let alive = true;
    let win = false;
    let cam = 0;

    for (let y = 0; y < spec.rows; y++) {
      for (let x = 0; x < spec.cols; x++) {
        if (getTile(spec, x, y) === TILE.enemy) enemies.push({ x: x * TS, y: y * TS, dir: 1, dead: false });
      }
    }

    const solid = (x: number, y: number) => getTile(spec, x, y) === TILE.ground;
    const down = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);

    const collide = (nx: number, ny: number, axis: 'x' | 'y') => {
      const x0 = Math.floor(nx / TS);
      const y0 = Math.floor(ny / TS);
      const x1 = Math.floor((nx + p.w - 1) / TS);
      const y1 = Math.floor((ny + p.h - 1) / TS);
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          if (!solid(tx, ty)) continue;
          if (axis === 'x') {
            p.vx = 0;
            return p.x;
          }
          if (p.vy > 0) {
            p.on = true;
            p.vy = 0;
            return ty * TS - p.h;
          }
          p.vy = 0;
          return (ty + 1) * TS;
        }
      }
      return axis === 'x' ? nx : ny;
    };

    const loop = () => {
      if (alive && !win) {
        const left = keys['a'] || keys['arrowleft'];
        const right = keys['d'] || keys['arrowright'];
        p.vx = (right ? 1 : 0) * spec.speed - (left ? 1 : 0) * spec.speed;
        p.vy += spec.gravity;
        if ((keys[' '] || keys['arrowup'] || keys['w']) && p.on) p.vy = -spec.jump;
        p.on = false;
        p.x = collide(p.x + p.vx, p.y, 'x');
        p.y = collide(p.x, p.y + p.vy, 'y');
        if (p.y > spec.rows * TS + 40) alive = false;

        const cx = Math.floor((p.x + p.w / 2) / TS);
        const cy = Math.floor((p.y + p.h / 2) / TS);
        const t = getTile(spec, cx, cy);
        const key = `${cx},${cy}`;
        if (t === TILE.hazard) alive = false;
        if (t === TILE.spring) p.vy = -spec.jump * 1.35;
        if (t === TILE.exit) win = true;
        if (t === TILE.coin && !gone.has(key)) {
          gone.add(key);
          coins += 1;
        }
        enemies.forEach((en) => {
          if (en.dead) return;
          en.x += en.dir * 1.2;
          const foot = getTile(spec, Math.floor((en.x + 14) / TS), Math.floor((en.y + 30) / TS));
          const wall = getTile(spec, Math.floor((en.x + (en.dir > 0 ? 24 : 0)) / TS), Math.floor((en.y + 10) / TS));
          if (foot !== TILE.ground || wall === TILE.ground) en.dir *= -1;
          const hit =
            p.x < en.x + 22 && p.x + p.w > en.x && p.y < en.y + 22 && p.y + p.h > en.y;
          if (hit) {
            if (p.vy > 0 && p.y + p.h < en.y + 14) {
              en.dead = true;
              p.vy = -6;
              coins += 1;
            } else alive = false;
          }
        });
        cam = Math.max(0, Math.min(spec.cols * TS - canvas.width, p.x - canvas.width / 2));
        setHud(win ? `Clear! ${coins} coins` : alive ? `${coins} coins` : 'Down — click Play to retry');
      }

      ctx.fillStyle = th.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let y = 0; y < spec.rows; y++) {
        for (let x = 0; x < spec.cols; x++) {
          const t = getTile(spec, x, y);
          const px = x * TS - cam;
          const py = y * TS;
          if (px < -TS || px > canvas.width) continue;
          if (t === TILE.empty || t === TILE.spawn) continue;
          if (t === TILE.coin && gone.has(`${x},${y}`)) continue;
          ctx.fillStyle =
            t === TILE.ground
              ? th.ground
              : t === TILE.hazard
                ? th.hazard
                : t === TILE.coin
                  ? th.coin
                  : t === TILE.exit
                    ? '#fff'
                    : t === TILE.spring
                      ? '#90e0ef'
                      : th.accent;
          if (t === TILE.coin) {
            ctx.beginPath();
            ctx.arc(px + 14, py + 14, 7, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(px, py, TS - 1, TS - 1);
          }
        }
      }
      enemies.forEach((en) => {
        if (en.dead) return;
        ctx.fillStyle = '#ff8fab';
        ctx.fillRect(en.x - cam, en.y, 22, 22);
      });
      ctx.fillStyle = th.accent;
      ctx.fillRect(p.x - cam, p.y, p.w, p.h);
      raf = requestAnimationFrame(loop);
    };
    let raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [spec]);

  return (
    <div>
      <canvas ref={ref} width={720} height={360} className="w-full rounded-2xl border border-white/10 bg-black" />
      <div className="text-xs opacity-60 mt-2">{hud}</div>
    </div>
  );
}
