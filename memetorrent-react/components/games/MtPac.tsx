'use client';

import { useEffect, useRef, useState } from 'react';
import NightDesk from '@/components/games/NightDesk';
import NightWallet from '@/components/games/NightWallet';

const MAP = [
  '#####################',
  '#........#..........#',
  '#o##.###.#.###.##.#o#',
  '#...................#',
  '#.##.#.#####.#.##.#.#',
  '#....#...#...#......#',
  '####.###.#.###.######',
  '###.#.#.......#.#.###',
  '####.#.##   ##.#.####',
  '     .#       #.     ',
  '####.#.#####.#.######',
  '###.#.#.......#.#.###',
  '####.#.#####.#.######',
  '#........#..........#',
  '#o##.###.#.###.##.#o#',
  '#..#.............#..#',
  '#.##.#.#####.#.##.#.#',
  '#....#...#...#......#',
  '#####################',
];

type Ghost = { x: number; y: number; c: string; home: { x: number; y: number }; eaten: number };

export default function MtPac() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [fright, setFright] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [flash, setFlash] = useState('');
  const dir = useRef({ x: 0, y: 0 });
  const want = useRef({ x: 0, y: 0 });
  const stopRef = useRef(false);

  function go(x: number, y: number) {
    want.current = { x, y };
    dir.current = { x, y };
  }

  useEffect(() => {
    if (!playing) return;
    stopRef.current = false;
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const rows = MAP.length, cols = MAP[0].length;
    const grid = MAP.map((r) => r.split(''));
    let px = 1, py = 1, mouth = 0, pts = 0, hp = 3, lv = 1, dots = 0, last = 0;
    let frightLeft = 0, ghostVal = 200, fruit = { x: 10, y: 13, k: '🍒', on: false, t: 0 };
    setLives(3); setLevel(1); setScore(0); setFright(0);
    const ghosts: Ghost[] = [
      { x: 10, y: 9, c: '#fb7185', home: { x: 10, y: 9 }, eaten: 0 },
      { x: 9, y: 9, c: '#f9a8d4', home: { x: 9, y: 9 }, eaten: 0 },
      { x: 11, y: 9, c: '#38bdf8', home: { x: 11, y: 9 }, eaten: 0 },
      { x: 10, y: 8, c: '#fb923c', home: { x: 10, y: 8 }, eaten: 0 },
    ];
    const countDots = () => {
      let n = 0;
      grid.forEach((r) => r.forEach((ch) => { if (ch === '.' || ch === 'o') n++; }));
      return n;
    };
    let leftDots = countDots();
    const wrap = (x: number, y: number) => {
      if (x < 0) x = cols - 1;
      if (x >= cols) x = 0;
      return { x, y };
    };
    const open = (x: number, y: number) => {
      const p = wrap(x, y);
      return grid[p.y] && grid[p.y][p.x] !== undefined && grid[p.y][p.x] !== '#';
    };
    const resetPos = () => {
      px = 1; py = 1; dir.current = { x: 0, y: 0 }; want.current = { x: 0, y: 0 };
      ghosts.forEach((g) => { g.x = g.home.x; g.y = g.home.y; g.eaten = 0; });
    };
    const refill = () => {
      MAP.forEach((r, y) => { grid[y] = r.split(''); });
      leftDots = countDots();
      fruit.on = false;
      resetPos();
    };
    const end = () => {
      on = false;
      setPlaying(false);
      fetch('/api/scores', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: 'pacman', score: pts }),
      }).catch(() => {});
    };
    const down = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') go(-1, 0);
      if (e.code === 'ArrowRight' || e.code === 'KeyD') go(1, 0);
      if (e.code === 'ArrowUp' || e.code === 'KeyW') go(0, -1);
      if (e.code === 'ArrowDown' || e.code === 'KeyS') go(0, 1);
    };
    let sx = 0, sy = 0;
    const pdown = (e: PointerEvent) => { sx = e.clientX; sy = e.clientY; };
    const pup = (e: PointerEvent) => {
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.hypot(dx, dy) < 18) return;
      if (Math.abs(dx) > Math.abs(dy)) go(dx > 0 ? 1 : -1, 0);
      else go(0, dy > 0 ? 1 : -1);
    };
    addEventListener('keydown', down);
    c.addEventListener('pointerdown', pdown);
    c.addEventListener('pointerup', pup);
    let acc = 0, on = true;
    const loop = (now: number) => {
      if (!on || stopRef.current) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      acc += dt;
      if (frightLeft > 0) {
        frightLeft = Math.max(0, frightLeft - dt);
        setFright(Math.ceil(frightLeft));
        if (frightLeft === 0) ghostVal = 200;
      }
      if (fruit.on) {
        fruit.t -= dt;
        if (fruit.t <= 0) fruit.on = false;
      }
      const step = Math.max(0.07, 0.15 - lv * 0.008);
      if (acc > step) {
        acc = 0;
        if (open(px + want.current.x, py + want.current.y)) dir.current = { ...want.current };
        if (open(px + dir.current.x, py + dir.current.y)) {
          const n = wrap(px + dir.current.x, py + dir.current.y);
          px = n.x; py = n.y;
        }
        const cell = grid[py][px];
        if (cell === '.' || cell === 'o') {
          pts += cell === 'o' ? 50 : 10;
          dots += 1;
          grid[py][px] = ' ';
          leftDots -= 1;
          if (cell === 'o') {
            frightLeft = 6.5;
            ghostVal = 200;
            setFright(7);
            setFlash('POWER');
            setTimeout(() => setFlash(''), 700);
          }
          if (dots === 40 || dots === 90) {
            fruit = { x: 10, y: 13, k: dots === 40 ? '🍒' : '🟢', on: true, t: 9 };
          }
          setScore(pts);
          if (leftDots <= 0) {
            lv += 1;
            setLevel(lv);
            pts += 200 * lv;
            setScore(pts);
            setFlash('LEVEL ' + lv);
            setTimeout(() => setFlash(''), 900);
            refill();
          }
        }
        if (fruit.on && px === fruit.x && py === fruit.y) {
          pts += fruit.k === '🟢' ? 200 : 100;
          fruit.on = false;
          setScore(pts);
          setFlash(fruit.k === '🟢' ? '$MT FRUIT' : 'CHERRY');
          setTimeout(() => setFlash(''), 700);
        }
        ghosts.forEach((g, i) => {
          if (g.eaten > 0) {
            g.eaten -= 1;
            if (g.eaten === 0) { g.x = g.home.x; g.y = g.home.y; }
            return;
          }
          const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([vx, vy]) => open(g.x + vx, g.y + vy));
          const tx = frightLeft > 0 ? px - (px - g.x) * 2 : i === 1 ? px + dir.current.x * 3 : i === 3 && Math.hypot(px - g.x, py - g.y) < 4 ? 1 : px;
          const ty = frightLeft > 0 ? py - (py - g.y) * 2 : i === 1 ? py + dir.current.y * 3 : py;
          opts.sort((a, b) => {
            const da = Math.abs(tx - (g.x + a[0])) + Math.abs(ty - (g.y + a[1]));
            const db = Math.abs(tx - (g.x + b[0])) + Math.abs(ty - (g.y + b[1]));
            return da - db;
          });
          const pick = frightLeft > 0
            ? opts[opts.length - 1] || [0, 0]
            : opts[Math.random() < (0.15 + i * 0.04) ? Math.floor(Math.random() * opts.length) : 0] || [0, 0];
          const n = wrap(g.x + pick[0], g.y + pick[1]);
          g.x = n.x; g.y = n.y;
          if (g.x === px && g.y === py) {
            if (frightLeft > 0) {
              pts += ghostVal;
              ghostVal *= 2;
              g.eaten = 12;
              setScore(pts);
              setFlash('+' + ghostVal / 2);
              setTimeout(() => setFlash(''), 500);
            } else {
              hp -= 1;
              setLives(hp);
              if (hp <= 0) end();
              else resetPos();
            }
          }
        });
        mouth += 1;
      }
      const dpr = devicePixelRatio || 1;
      const cw = c.clientWidth * dpr, ch = c.clientHeight * dpr;
      if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
      const cell = Math.min(c.width / cols, c.height / rows);
      const ox = (c.width - cell * cols) / 2, oy = (c.height - cell * rows) / 2;
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, c.width, c.height);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const X = ox + x * cell, Y = oy + y * cell;
          if (grid[y][x] === '#') {
            ctx.fillStyle = '#14532d';
            ctx.fillRect(X + 1, Y + 1, cell - 2, cell - 2);
            ctx.fillStyle = '#19d37e';
            ctx.fillRect(X + 2, Y + 2, cell - 4, 2);
          } else if (grid[y][x] === '.') {
            ctx.fillStyle = '#fde68a';
            ctx.beginPath(); ctx.arc(X + cell / 2, Y + cell / 2, Math.max(1.5, cell * 0.08), 0, Math.PI * 2); ctx.fill();
          } else if (grid[y][x] === 'o') {
            ctx.fillStyle = frightLeft > 0 ? '#86efac' : '#19d37e';
            ctx.beginPath(); ctx.arc(X + cell / 2, Y + cell / 2, cell * 0.22, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
      if (fruit.on) {
        ctx.font = `${cell * 0.8}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fruit.k, ox + fruit.x * cell + cell / 2, oy + fruit.y * cell + cell / 2);
      }
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      const ang = mouth % 2 ? 0.45 : 0.12;
      const rot = dir.current.x === 1 ? 0 : dir.current.x === -1 ? Math.PI : dir.current.y === -1 ? -Math.PI / 2 : dir.current.y === 1 ? Math.PI / 2 : 0;
      const cx = ox + px * cell + cell / 2, cy = oy + py * cell + cell / 2;
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, cell * 0.4, rot + ang, rot + Math.PI * 2 - ang);
      ctx.fill();
      ghosts.forEach((g) => {
        if (g.eaten > 0) {
          ctx.fillStyle = '#e5e7eb';
          ctx.beginPath();
          ctx.arc(ox + g.x * cell + cell / 2, oy + g.y * cell + cell / 2, cell * 0.14, 0, Math.PI * 2);
          ctx.fill();
          return;
        }
        const blink = frightLeft > 0 && frightLeft < 1.6 && Math.floor(now / 120) % 2;
        ctx.fillStyle = frightLeft > 0 && !blink ? '#1d4ed8' : g.c;
        ctx.beginPath();
        ctx.arc(ox + g.x * cell + cell / 2, oy + g.y * cell + cell * 0.46, cell * 0.36, Math.PI, 0);
        ctx.lineTo(ox + g.x * cell + cell * 0.86, oy + g.y * cell + cell * 0.82);
        ctx.lineTo(ox + g.x * cell + cell * 0.68, oy + g.y * cell + cell * 0.68);
        ctx.lineTo(ox + g.x * cell + cell * 0.5, oy + g.y * cell + cell * 0.82);
        ctx.lineTo(ox + g.x * cell + cell * 0.32, oy + g.y * cell + cell * 0.68);
        ctx.lineTo(ox + g.x * cell + cell * 0.14, oy + g.y * cell + cell * 0.82);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ox + g.x * cell + cell * 0.38, oy + g.y * cell + cell * 0.42, cell * 0.1, 0, Math.PI * 2);
        ctx.arc(ox + g.x * cell + cell * 0.62, oy + g.y * cell + cell * 0.42, cell * 0.1, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(loop);
    };
    const id = requestAnimationFrame(loop);
    return () => {
      on = false;
      cancelAnimationFrame(id);
      removeEventListener('keydown', down);
      c.removeEventListener('pointerdown', pdown);
      c.removeEventListener('pointerup', pup);
    };
  }, [playing]);

  return (
    <div>
      <canvas ref={ref} className="w-full h-[58vh] rounded-3xl border border-emerald-400/30 bg-black touch-none" />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>
          Score <span className="text-emerald-400 font-mono">{score}</span>
          {' · '}Lv {level}
          {' · '}{'♥'.repeat(Math.max(0, lives))}
          {fright > 0 ? ` · FRIGHT ${fright}s` : ''}
          {flash ? <span className="ml-2 text-amber-300 font-black">{flash}</span> : null}
        </span>
        <div className="flex gap-2">
          {playing && (
            <button type="button" onClick={() => { stopRef.current = true; setPlaying(false); }} className="rounded-full border border-white/20 px-4 py-2">
              Stop
            </button>
          )}
          <button type="button" onClick={() => { setScore(0); setLives(3); setPlaying(true); }} className="rounded-full bg-emerald-400 text-black font-bold px-5 py-2">
            {playing ? 'Mazing…' : 'Play'}
          </button>
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-3">
        <div className="grid grid-cols-3 gap-2 w-40">
          <span />
          <button type="button" onPointerDown={() => go(0, -1)} className="h-12 rounded-xl bg-emerald-400/20 border border-emerald-400/40">▲</button>
          <span />
          <button type="button" onPointerDown={() => go(-1, 0)} className="h-12 rounded-xl bg-emerald-400/20 border border-emerald-400/40">◀</button>
          <button type="button" onPointerDown={() => go(0, 1)} className="h-12 rounded-xl bg-emerald-400/20 border border-emerald-400/40">▼</button>
          <button type="button" onPointerDown={() => go(1, 0)} className="h-12 rounded-xl bg-emerald-400/20 border border-emerald-400/40">▶</button>
        </div>
      </div>
      <p className="mt-2 text-xs opacity-50 text-center">
        3 lives. Green orbs frighten ghosts — eat them. 🍒 then 🟢 fruit. Side tunnels wrap. Swipe or pad. Levels speed up.
      </p>
      <div className="mt-6 max-w-md mx-auto"><NightWallet name="" /></div>
      <NightDesk />
    </div>
  );
}
