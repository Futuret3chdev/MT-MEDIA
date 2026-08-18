'use client';

import { useEffect, useRef, useState } from 'react';
import NightDesk from '@/components/games/NightDesk';
import NightWallet from '@/components/games/NightWallet';

const MAP = [
  '#####################',
  '#........#..........#',
  '#.##.###.#.###.##.#.#',
  '#o#...............#o#',
  '#.##.#.#####.#.##.#.#',
  '#....#...#...#......#',
  '####.###.#.###.######',
  '###.#.#.......#.#.###',
  '####.#.## ###.#.#####',
  '#........# #........#',
  '####.#.#####.#.######',
  '###.#.#.......#.#.###',
  '####.#.#####.#.######',
  '#........#..........#',
  '#.##.###.#.###.##.#.#',
  '#o.#.............#.o#',
  '#.##.#.#####.#.##.#.#',
  '#....#...#...#......#',
  '#####################',
];

export default function MtPac() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [playing, setPlaying] = useState(false);
  const dir = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!playing) return;
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const rows = MAP.length, cols = MAP[0].length;
    const grid = MAP.map((r) => r.split(''));
    let px = 1, py = 1, mouth = 0, pts = 0, last = 0;
    const ghosts = [
      { x: 10, y: 9, vx: 1, vy: 0, c: '#fb7185' },
      { x: 9, y: 9, vx: -1, vy: 0, c: '#38bdf8' },
    ];
    const open = (x: number, y: number) => grid[y] && grid[y][x] && grid[y][x] !== '#';
    const down = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') dir.current = { x: -1, y: 0 };
      if (e.code === 'ArrowRight' || e.code === 'KeyD') dir.current = { x: 1, y: 0 };
      if (e.code === 'ArrowUp' || e.code === 'KeyW') dir.current = { x: 0, y: -1 };
      if (e.code === 'ArrowDown' || e.code === 'KeyS') dir.current = { x: 0, y: 1 };
    };
    addEventListener('keydown', down);
    let acc = 0, on = true;
    const loop = (now: number) => {
      if (!on) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      acc += dt;
      if (acc > 0.14) {
        acc = 0;
        const nx = px + dir.current.x, ny = py + dir.current.y;
        if (open(nx, ny)) { px = nx; py = ny; }
        if (grid[py][px] === '.' || grid[py][px] === 'o') {
          pts += grid[py][px] === 'o' ? 10 : 1;
          grid[py][px] = ' ';
          setScore(pts);
        }
        ghosts.forEach((g) => {
          const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([vx, vy]) => open(g.x + vx, g.y + vy));
          const prefer = opts.find(([vx, vy]) => Math.abs(px - (g.x + vx)) + Math.abs(py - (g.y + vy)) < Math.abs(px - g.x) + Math.abs(py - g.y));
          const [vx, vy] = prefer || opts[Math.floor(Math.random() * opts.length)] || [0, 0];
          g.x += vx; g.y += vy;
          if (g.x === px && g.y === py) {
            on = false;
            setPlaying(false);
            fetch('/api/scores', {
              method: 'POST', credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ game_id: 'pacman', score: pts }),
            }).catch(() => {});
          }
        });
        mouth += 1;
      }
      const cell = Math.min(c.width / cols, c.height / rows);
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, c.width, c.height);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const X = x * cell, Y = y * cell;
          if (grid[y][x] === '#') {
            ctx.fillStyle = '#19d37e';
            ctx.fillRect(X + 1, Y + 1, cell - 2, cell - 2);
          } else if (grid[y][x] === '.') {
            ctx.fillStyle = '#fde68a';
            ctx.beginPath(); ctx.arc(X + cell / 2, Y + cell / 2, 2, 0, Math.PI * 2); ctx.fill();
          } else if (grid[y][x] === 'o') {
            ctx.fillStyle = '#19d37e';
            ctx.beginPath(); ctx.arc(X + cell / 2, Y + cell / 2, 5, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      const ang = mouth % 2 ? 0.4 : 0.1;
      ctx.moveTo(px * cell + cell / 2, py * cell + cell / 2);
      ctx.arc(px * cell + cell / 2, py * cell + cell / 2, cell * 0.38, ang, Math.PI * 2 - ang);
      ctx.fill();
      ghosts.forEach((g) => {
        ctx.fillStyle = g.c;
        ctx.beginPath();
        ctx.arc(g.x * cell + cell / 2, g.y * cell + cell / 2, cell * 0.36, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(loop);
    };
    const id = requestAnimationFrame(loop);
    const size = () => { c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio; };
    size();
    return () => { on = false; cancelAnimationFrame(id); removeEventListener('keydown', down); };
  }, [playing]);

  return (
    <div>
      <canvas ref={ref} className="w-full h-[58vh] rounded-3xl border border-emerald-400/30 bg-black" />
      <div className="mt-3 flex justify-between text-sm">
        <span>Score <span className="text-emerald-400 font-mono">{score}</span></span>
        <button type="button" onClick={() => { setScore(0); setPlaying(true); }} className="rounded-full bg-emerald-400 text-black font-bold px-5 py-2">
          {playing ? 'Mazing…' : 'Play'}
        </button>
      </div>
      <p className="mt-2 text-xs opacity-50">WASD / arrows. Dots are gold. Big green orbs are $MT. Don’t get caught.</p>
      <div className="mt-6 max-w-md"><NightWallet name="" /></div>
      <NightDesk />
    </div>
  );
}
