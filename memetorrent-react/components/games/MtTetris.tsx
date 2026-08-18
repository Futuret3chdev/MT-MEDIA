'use client';

import { useEffect, useRef, useState } from 'react';
import NightDesk from '@/components/games/NightDesk';
import NightWallet from '@/components/games/NightWallet';

const SHAPES: number[][][] = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[0, 1, 0], [1, 1, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]],
  [[0, 1, 1], [1, 1, 0]],
  [[1, 1, 0], [0, 1, 1]],
];
const COLS = ['#19d37e', '#38bdf8', '#fbbf24', '#fb7185', '#a78bfa', '#f97316', '#e5e7eb'];

function rot(m: number[][]) {
  const h = m.length, w = m[0].length;
  const n = Array.from({ length: w }, () => Array(h).fill(0));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) n[x][h - 1 - y] = m[y][x];
  return n;
}

export default function MtTetris({ mob = false }: { mob?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [playing, setPlaying] = useState(false);
  const act = useRef<(k: string) => void>(() => {});

  useEffect(() => {
    if (!playing) return;
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const W = 10, H = 20;
    const board = Array.from({ length: H }, () => Array(W).fill(0));
    let piece = { m: SHAPES[0], x: 3, y: 0, c: 1 };
    let pts = 0, drop = 0, on = true;
    const spawn = () => {
      const i = Math.floor(Math.random() * SHAPES.length);
      piece = { m: SHAPES[i].map((r) => [...r]), x: 3, y: 0, c: i + 1 };
      if (!fits(piece.x, piece.y, piece.m)) {
        on = false;
        setPlaying(false);
        fetch('/api/scores', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ game_id: mob ? 'tetrismob' : 'tetris', score: pts }),
        }).catch(() => {});
      }
    };
    const fits = (x: number, y: number, m: number[][]) => {
      for (let j = 0; j < m.length; j++)
        for (let i = 0; i < m[j].length; i++)
          if (m[j][i] && (y + j >= H || x + i < 0 || x + i >= W || (y + j >= 0 && board[y + j][x + i]))) return false;
      return true;
    };
    const merge = () => {
      piece.m.forEach((row, j) => row.forEach((v, i) => { if (v && piece.y + j >= 0) board[piece.y + j][piece.x + i] = piece.c; }));
      let cleared = 0;
      for (let y = H - 1; y >= 0; y--) {
        if (board[y].every(Boolean)) {
          board.splice(y, 1);
          board.unshift(Array(W).fill(0));
          cleared++;
          y++;
        }
      }
      if (cleared) {
        pts += [0, 40, 100, 300, 1200][cleared];
        setScore(pts);
      }
      spawn();
    };
    const move = (dx: number, dy: number) => {
      if (fits(piece.x + dx, piece.y + dy, piece.m)) { piece.x += dx; piece.y += dy; return true; }
      return false;
    };
    act.current = (k: string) => {
      if (k === 'L') move(-1, 0);
      if (k === 'R') move(1, 0);
      if (k === 'D') { if (!move(0, 1)) merge(); }
      if (k === 'U') {
        const n = rot(piece.m);
        if (fits(piece.x, piece.y, n)) piece.m = n;
      }
    };
    const key = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') act.current('L');
      if (e.code === 'ArrowRight' || e.code === 'KeyD') act.current('R');
      if (e.code === 'ArrowDown' || e.code === 'KeyS') act.current('D');
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') { e.preventDefault(); act.current('U'); }
    };
    addEventListener('keydown', key);
    spawn();
    let last = performance.now();
    const loop = (now: number) => {
      if (!on) return;
      drop += now - last;
      last = now;
      if (drop > (mob ? 520 : 460)) {
        drop = 0;
        if (!move(0, 1)) merge();
      }
      const cw = c.width = c.clientWidth * devicePixelRatio;
      const ch = c.height = c.clientHeight * devicePixelRatio;
      const cell = Math.min(cw / W, ch / H);
      ctx.fillStyle = '#05070c';
      ctx.fillRect(0, 0, cw, ch);
      const draw = (x: number, y: number, col: number) => {
        ctx.fillStyle = COLS[(col - 1) % COLS.length];
        ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
      };
      board.forEach((row, y) => row.forEach((v, x) => { if (v) draw(x, y, v); }));
      piece.m.forEach((row, j) => row.forEach((v, i) => { if (v) draw(piece.x + i, piece.y + j, piece.c); }));
      requestAnimationFrame(loop);
    };
    const id = requestAnimationFrame(loop);
    return () => { on = false; cancelAnimationFrame(id); removeEventListener('keydown', key); };
  }, [playing, mob]);

  return (
    <div>
      <canvas ref={ref} className={`w-full ${mob ? 'h-[62vh]' : 'h-[70vh]'} max-w-sm mx-auto rounded-3xl border border-emerald-400/30 bg-black block`} />
      {mob && (
        <div className="flex justify-center gap-3 mt-3">
          {['L', 'D', 'U', 'R'].map((k) => (
            <button key={k} type="button" onPointerDown={() => act.current(k)} className="w-16 h-16 rounded-2xl bg-emerald-400/20 border border-emerald-400/40 text-lg font-black">
              {k === 'L' ? '◀' : k === 'R' ? '▶' : k === 'D' ? '▼' : '⟳'}
            </button>
          ))}
        </div>
      )}
      <div className="mt-3 flex justify-between text-sm max-w-sm mx-auto">
        <span>Score <span className="text-emerald-400 font-mono">{score}</span></span>
        <button type="button" onClick={() => { setScore(0); setPlaying(true); }} className="rounded-full bg-emerald-400 text-black font-bold px-5 py-2">
          {playing ? 'Stacking…' : 'Play'}
        </button>
      </div>
      <p className="mt-2 text-xs opacity-50 text-center">{mob ? 'Big pads for thumbs.' : 'Arrows / WASD · Up or Space rotate.'}</p>
      <div className="mt-6 max-w-md mx-auto"><NightWallet name="" /></div>
      <NightDesk />
    </div>
  );
}
