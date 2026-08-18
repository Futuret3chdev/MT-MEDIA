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
const NAMES = ['I', 'O', 'T', 'J', 'L', 'S', 'Z'];

function rot(m: number[][]) {
  const h = m.length, w = m[0].length;
  const n = Array.from({ length: w }, () => Array(h).fill(0));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) n[x][h - 1 - y] = m[y][x];
  return n;
}

function bag() {
  const o = [0, 1, 2, 3, 4, 5, 6];
  for (let i = o.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [o[i], o[j]] = [o[j], o[i]];
  }
  return o;
}

export default function MtTetris({ mob = false }: { mob?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [holdId, setHoldId] = useState<number | null>(null);
  const [nextIds, setNextIds] = useState<number[]>([]);
  const [flash, setFlash] = useState('');
  const [playing, setPlaying] = useState(false);
  const act = useRef<(k: string) => void>(() => {});
  const stopRef = useRef(false);

  useEffect(() => {
    if (!playing) return;
    stopRef.current = false;
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const W = 10, H = 20;
    const board = Array.from({ length: H }, () => Array(W).fill(0));
    let queue = [...bag(), ...bag()];
    let piece = { m: SHAPES[0], x: 3, y: 0, c: 1, id: 0 };
    let hold: number | null = null;
    let heldThis = false;
    let pts = 0, clearedTotal = 0, cmb = 0, drop = 0, on = true;
    setScore(0); setLines(0); setLevel(1); setCombo(0); setHoldId(null);
    const take = () => {
      if (queue.length < 7) queue = queue.concat(bag());
      return queue.shift() as number;
    };
    const make = (id: number) => ({ m: SHAPES[id].map((r) => [...r]), x: 3, y: 0, c: id + 1, id });
    const peek = () => {
      setNextIds(queue.slice(0, 3));
      setHoldId(hold);
    };
    const fits = (x: number, y: number, m: number[][]) => {
      for (let j = 0; j < m.length; j++)
        for (let i = 0; i < m[j].length; i++)
          if (m[j][i] && (y + j >= H || x + i < 0 || x + i >= W || (y + j >= 0 && board[y + j][x + i]))) return false;
      return true;
    };
    const spawn = (id?: number) => {
      piece = make(id ?? take());
      heldThis = false;
      peek();
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
    const ghostY = () => {
      let y = piece.y;
      while (fits(piece.x, y + 1, piece.m)) y++;
      return y;
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
      const lv = 1 + Math.floor(clearedTotal / 10);
      if (cleared) {
        cmb += 1;
        clearedTotal += cleared;
        const base = [0, 100, 300, 500, 800][cleared] * lv;
        const extra = cleared === 4 ? 400 : 0;
        const comboPts = cmb > 1 ? (cmb - 1) * 50 : 0;
        pts += base + extra + comboPts;
        setScore(pts);
        setLines(clearedTotal);
        setLevel(1 + Math.floor(clearedTotal / 10));
        setCombo(cmb);
        setFlash(cleared === 4 ? '$MT TETRIS' : cmb > 1 ? 'COMBO x' + cmb : '+' + (base + extra));
        setTimeout(() => setFlash(''), 700);
      } else {
        cmb = 0;
        setCombo(0);
      }
      spawn();
    };
    const move = (dx: number, dy: number) => {
      if (fits(piece.x + dx, piece.y + dy, piece.m)) { piece.x += dx; piece.y += dy; return true; }
      return false;
    };
    const kick = (m: number[][]) => {
      for (const dx of [0, -1, 1, -2, 2]) if (fits(piece.x + dx, piece.y, m)) { piece.x += dx; piece.m = m; return; }
    };
    act.current = (k: string) => {
      if (!on) return;
      if (k === 'L') move(-1, 0);
      if (k === 'R') move(1, 0);
      if (k === 'D') { if (!move(0, 1)) merge(); else { pts += 1; setScore(pts); } }
      if (k === 'U') kick(rot(piece.m));
      if (k === 'HARD') {
        let n = 0;
        while (move(0, 1)) n++;
        pts += n * 2;
        setScore(pts);
        merge();
      }
      if (k === 'HOLD') {
        if (heldThis) return;
        const cur = piece.id;
        if (hold === null) {
          hold = cur;
          spawn();
        } else {
          const swap = hold;
          hold = cur;
          spawn(swap);
        }
        heldThis = true;
        peek();
      }
    };
    const key = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') act.current('L');
      if (e.code === 'ArrowRight' || e.code === 'KeyD') act.current('R');
      if (e.code === 'ArrowDown' || e.code === 'KeyS') act.current('D');
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'KeyX') { e.preventDefault(); act.current('U'); }
      if (e.code === 'Space') { e.preventDefault(); act.current('HARD'); }
      if (e.code === 'KeyC' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') act.current('HOLD');
    };
    let sx = 0, sy = 0, st = 0;
    const pdown = (e: PointerEvent) => { sx = e.clientX; sy = e.clientY; st = performance.now(); };
    const pup = (e: PointerEvent) => {
      if (!mob) return;
      const dx = e.clientX - sx, dy = e.clientY - sy, dt = performance.now() - st;
      if (Math.hypot(dx, dy) < 16) {
        if (dt > 380) act.current('HOLD');
        else act.current('U');
        return;
      }
      if (Math.abs(dx) > Math.abs(dy)) act.current(dx > 0 ? 'R' : 'L');
      else if (dy > 90) act.current('HARD');
      else if (dy > 24) act.current('D');
      else act.current('U');
    };
    addEventListener('keydown', key);
    c.addEventListener('pointerdown', pdown);
    c.addEventListener('pointerup', pup);
    spawn();
    let last = performance.now();
    const loop = (now: number) => {
      if (!on || stopRef.current) return;
      drop += now - last;
      last = now;
      const lv = 1 + Math.floor(clearedTotal / 10);
      const ms = Math.max(90, (mob ? 540 : 480) - lv * 38);
      if (drop > ms) {
        drop = 0;
        if (!move(0, 1)) merge();
      }
      const dpr = devicePixelRatio || 1;
      const cw = c.clientWidth * dpr, ch = c.clientHeight * dpr;
      if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
      const cell = Math.min(cw / W, ch / H);
      const ox = (cw - cell * W) / 2, oy = (ch - cell * H) / 2;
      ctx.fillStyle = '#05070c';
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(ox, oy, cell * W, cell * H);
      const draw = (x: number, y: number, col: number, a = 1) => {
        ctx.globalAlpha = a;
        ctx.fillStyle = COLS[(col - 1) % COLS.length];
        ctx.fillRect(ox + x * cell + 1, oy + y * cell + 1, cell - 2, cell - 2);
        ctx.globalAlpha = 1;
      };
      board.forEach((row, y) => row.forEach((v, x) => { if (v) draw(x, y, v); }));
      const gy = ghostY();
      piece.m.forEach((row, j) => row.forEach((v, i) => { if (v) draw(piece.x + i, gy + j, piece.c, 0.22); }));
      piece.m.forEach((row, j) => row.forEach((v, i) => { if (v) draw(piece.x + i, piece.y + j, piece.c); }));
      requestAnimationFrame(loop);
    };
    const id = requestAnimationFrame(loop);
    return () => {
      on = false;
      cancelAnimationFrame(id);
      removeEventListener('keydown', key);
      c.removeEventListener('pointerdown', pdown);
      c.removeEventListener('pointerup', pup);
    };
  }, [playing, mob]);

  const mini = (id: number | null, label: string) => (
    <div className="rounded-2xl border border-white/10 px-3 py-2 min-w-[72px] text-center">
      <div className="text-[10px] uppercase tracking-[1px] opacity-50">{label}</div>
      <div className="text-lg font-black" style={{ color: id === null ? '#64748b' : COLS[id] }}>
        {id === null ? '—' : NAMES[id]}
      </div>
    </div>
  );

  return (
    <div>
      <canvas ref={ref} className={`w-full ${mob ? 'h-[58vh]' : 'h-[70vh]'} max-w-sm mx-auto rounded-3xl border border-emerald-400/30 bg-black block touch-none`} />
      <div className="mt-3 flex justify-center gap-2 flex-wrap max-w-sm mx-auto">
        {mini(holdId, 'Hold')}
        {nextIds.map((id, i) => <span key={i}>{mini(id, i === 0 ? 'Next' : 'Then')}</span>)}
      </div>
      <div className="mt-3 flex justify-between text-sm max-w-sm mx-auto">
        <span>
          <span className="text-emerald-400 font-mono">{score}</span>
          {' · '}L{level}
          {' · '}{lines} lines
          {combo > 1 ? <span className="text-amber-300"> · x{combo}</span> : null}
          {flash ? <span className="ml-2 text-amber-300 font-black">{flash}</span> : null}
        </span>
        <div className="flex gap-2">
          {playing && (
            <button type="button" onClick={() => { stopRef.current = true; setPlaying(false); }} className="rounded-full border border-white/20 px-3 py-2 text-xs">
              Stop
            </button>
          )}
          <button type="button" onClick={() => { setScore(0); setPlaying(true); }} className="rounded-full bg-emerald-400 text-black font-bold px-5 py-2">
            {playing ? 'Stacking…' : 'Play'}
          </button>
        </div>
      </div>
      {mob ? (
        <div className="mt-3 max-w-sm mx-auto">
          <div className="grid grid-cols-5 gap-2">
            <button type="button" onPointerDown={() => act.current('HOLD')} className="h-14 rounded-2xl bg-amber-400/15 border border-amber-300/40 text-xs font-black">HOLD</button>
            <button type="button" onPointerDown={() => act.current('L')} className="h-14 rounded-2xl bg-emerald-400/20 border border-emerald-400/40">◀</button>
            <button type="button" onPointerDown={() => act.current('D')} className="h-14 rounded-2xl bg-emerald-400/20 border border-emerald-400/40">▼</button>
            <button type="button" onPointerDown={() => act.current('R')} className="h-14 rounded-2xl bg-emerald-400/20 border border-emerald-400/40">▶</button>
            <button type="button" onPointerDown={() => act.current('HARD')} className="h-14 rounded-2xl bg-emerald-400 text-black text-xs font-black">DROP</button>
          </div>
          <button type="button" onPointerDown={() => act.current('U')} className="mt-2 w-full h-12 rounded-2xl bg-emerald-400/20 border border-emerald-400/40 font-bold">
            Rotate
          </button>
          <p className="mt-2 text-xs opacity-50 text-center">Swipe: L/R, down soft, long down hard drop, tap rotate, long-press hold.</p>
        </div>
      ) : (
        <p className="mt-2 text-xs opacity-50 text-center">←→ move · ↓ soft · Space hard drop · Up/X rotate · C / Shift hold. 4-line is $MT Tetris.</p>
      )}
      <div className="mt-6 max-w-md mx-auto"><NightWallet name="" /></div>
      <NightDesk />
    </div>
  );
}
