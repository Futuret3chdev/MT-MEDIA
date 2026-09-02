'use client';

import { useEffect, useRef, useState } from 'react';

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
const FEVER = ['#19d37e', '#4ade80', '#fbbf24', '#86efac', '#34d399', '#f59e0b', '#a7f3d0'];
const NAMES = ['I', 'O', 'T', 'J', 'L', 'S', 'Z'];
type Mode = 'classic' | 'sprint' | 'ultra' | 'fever' | 'zen';

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

export default function MtTetris({ mob = false, embed = false }: { mob?: boolean; embed?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [holdId, setHoldId] = useState<number | null>(null);
  const [nextIds, setNextIds] = useState<number[]>([]);
  const [flash, setFlash] = useState('');
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<Mode>('classic');
  const [clock, setClock] = useState(0);
  const act = useRef<(k: string) => void>(() => {});
  const stopRef = useRef(false);
  const holdDir = useRef({ L: 0, R: 0 });

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
    let pts = 0, clearedTotal = 0, cmb = 0, drop = 0, lock = 0, on = true;
    let left = mode === 'ultra' ? 120 : 0;
    setScore(0); setLines(0); setLevel(1); setCombo(0); setHoldId(null); setClock(left);
    const palette = mode === 'fever' ? FEVER : COLS;
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
    const end = () => {
      if (!on) return;
      on = false;
      setPlaying(false);
      if (mode !== 'zen') {
        fetch('/api/scores', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ game_id: mob ? 'tetrismob' : 'tetris', score: pts }),
        }).catch(() => {});
      }
    };
    const spawn = (id?: number) => {
      piece = make(id ?? take());
      heldThis = false;
      lock = 0;
      peek();
      if (!fits(piece.x, piece.y, piece.m)) {
        if (mode === 'zen') {
          for (let i = 0; i < 4; i++) { board.shift(); board.push(Array(W).fill(0)); }
          if (!fits(piece.x, piece.y, piece.m)) end();
        } else end();
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
        const fever = mode === 'fever' && cleared === 4 ? 800 : 0;
        const base = [0, 100, 300, 500, 800][cleared] * lv;
        const extra = cleared === 4 ? 400 + fever : 0;
        const comboPts = cmb > 1 ? (cmb - 1) * 50 : 0;
        pts += base + extra + comboPts;
        setScore(pts);
        setLines(clearedTotal);
        setLevel(1 + Math.floor(clearedTotal / 10));
        setCombo(cmb);
        setFlash(cleared === 4 ? '$MT TETRIS' : cmb > 1 ? 'COMBO x' + cmb : '+' + (base + extra));
        setTimeout(() => setFlash(''), 700);
        if (mode === 'sprint' && clearedTotal >= 40) end();
      } else {
        cmb = 0;
        setCombo(0);
      }
      spawn();
    };
    const move = (dx: number, dy: number) => {
      if (fits(piece.x + dx, piece.y + dy, piece.m)) {
        piece.x += dx; piece.y += dy;
        if (dx) lock = 0;
        return true;
      }
      return false;
    };
    const kick = (m: number[][]) => {
      for (const dx of [0, -1, 1, -2, 2]) if (fits(piece.x + dx, piece.y, m)) { piece.x += dx; piece.m = m; lock = 0; return; }
    };
    act.current = (k: string) => {
      if (!on) return;
      if (k === 'L') move(-1, 0);
      if (k === 'R') move(1, 0);
      if (k === 'D') { if (!move(0, 1)) merge(); else { pts += 1; setScore(pts); } }
      if (k === 'U') kick(rot(piece.m));
      if (k === '180') kick(rot(rot(piece.m)));
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
    const down = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { act.current('L'); holdDir.current.L = performance.now(); }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { act.current('R'); holdDir.current.R = performance.now(); }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') act.current('D');
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'KeyX') { e.preventDefault(); act.current('U'); }
      if (e.code === 'KeyZ') { e.preventDefault(); act.current('180'); }
      if (e.code === 'Space') { e.preventDefault(); act.current('HARD'); }
      if (e.code === 'KeyC' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') act.current('HOLD');
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') holdDir.current.L = 0;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') holdDir.current.R = 0;
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
    addEventListener('keydown', down);
    addEventListener('keyup', up);
    c.addEventListener('pointerdown', pdown);
    c.addEventListener('pointerup', pup);
    spawn();
    let last = performance.now();
    const loop = (now: number) => {
      if (!on || stopRef.current) return;
      const dt = now - last;
      last = now;
      drop += dt;
      if (mode === 'ultra') {
        left -= dt / 1000;
        setClock(Math.max(0, Math.ceil(left)));
        if (left <= 0) { end(); return; }
      }
      if (holdDir.current.L && now - holdDir.current.L > 160) { act.current('L'); holdDir.current.L = now - 110; }
      if (holdDir.current.R && now - holdDir.current.R > 160) { act.current('R'); holdDir.current.R = now - 110; }
      const lv = 1 + Math.floor(clearedTotal / 10);
      const ms = Math.max(90, (mob ? 540 : 480) - lv * 38);
      const grounded = !fits(piece.x, piece.y + 1, piece.m);
      if (grounded) {
        lock += dt;
        if (lock > 480) { lock = 0; merge(); }
      } else lock = 0;
      if (!grounded && drop > ms) {
        drop = 0;
        move(0, 1);
      }
      const dpr = devicePixelRatio || 1;
      const cw = c.clientWidth * dpr, ch = c.clientHeight * dpr;
      if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
      const cell = Math.min(cw / W, ch / H);
      const ox = (cw - cell * W) / 2, oy = (ch - cell * H) / 2;
      ctx.fillStyle = mode === 'fever' ? '#02140c' : '#05070c';
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(ox, oy, cell * W, cell * H);
      const draw = (x: number, y: number, col: number, a = 1) => {
        ctx.globalAlpha = a;
        ctx.fillStyle = palette[(col - 1) % palette.length];
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
      removeEventListener('keydown', down);
      removeEventListener('keyup', up);
      c.removeEventListener('pointerdown', pdown);
      c.removeEventListener('pointerup', pup);
    };
  }, [playing, mob, mode]);

  const mini = (id: number | null, label: string) => (
    <div className="rounded-2xl border border-white/10 px-3 py-2 min-w-[72px] text-center">
      <div className="text-[10px] uppercase tracking-[1px] opacity-50">{label}</div>
      <div className="text-lg font-black" style={{ color: id === null ? '#64748b' : COLS[id] }}>
        {id === null ? '—' : NAMES[id]}
      </div>
    </div>
  );

  const modes: { id: Mode; label: string }[] = [
    { id: 'classic', label: 'Classic' },
    { id: 'sprint', label: 'Sprint 40' },
    { id: 'ultra', label: 'Ultra 2m' },
    { id: 'fever', label: '$MT Fever' },
    { id: 'zen', label: 'Zen' },
  ];

  const pad = mob ? (
    <div className="shrink-0 px-2 pb-2">
      <div className="grid grid-cols-5 gap-2">
        <button type="button" onPointerDown={() => act.current('HOLD')} className="h-12 rounded-2xl bg-amber-400/15 border border-amber-300/40 text-xs font-black">HOLD</button>
        <button type="button" onPointerDown={() => { act.current('L'); holdDir.current.L = performance.now(); }} onPointerUp={() => { holdDir.current.L = 0; }} className="h-12 rounded-2xl bg-emerald-400/20 border border-emerald-400/40">◀</button>
        <button type="button" onPointerDown={() => act.current('D')} className="h-12 rounded-2xl bg-emerald-400/20 border border-emerald-400/40">▼</button>
        <button type="button" onPointerDown={() => { act.current('R'); holdDir.current.R = performance.now(); }} onPointerUp={() => { holdDir.current.R = 0; }} className="h-12 rounded-2xl bg-emerald-400/20 border border-emerald-400/40">▶</button>
        <button type="button" onPointerDown={() => act.current('HARD')} className="h-12 rounded-2xl bg-emerald-400 text-black text-xs font-black">DROP</button>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button type="button" onPointerDown={() => act.current('U')} className="h-11 rounded-2xl bg-emerald-400/20 border border-emerald-400/40 font-bold">Rotate</button>
        <button type="button" onPointerDown={() => act.current('180')} className="h-11 rounded-2xl bg-emerald-400/20 border border-emerald-400/40 font-bold">180</button>
      </div>
    </div>
  ) : null;

  if (embed) {
    return (
      <div className="h-full w-full min-h-0 flex flex-col bg-[#05070c]">
        {!playing && (
          <div className="px-3 pt-3 shrink-0">
            <div className="grid grid-cols-5 gap-2 max-w-3xl mx-auto">
              {modes.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`rounded-xl px-2 py-2 text-xs font-bold border ${
                    mode === m.id ? 'bg-emerald-400 text-black border-emerald-400' : 'border-white/15'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex-1 min-h-0 flex gap-2 px-2 py-2">
          <div className="hidden sm:flex flex-col gap-2 shrink-0 justify-center">
            {mini(holdId, 'Hold')}
            {nextIds.map((id, i) => mini(id, i === 0 ? 'Next' : 'Then'))}
          </div>
          <canvas ref={ref} className="flex-1 min-h-0 w-full h-full bg-black touch-none block" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm shrink-0">
          <span>
            <span className="text-emerald-400 font-mono">{score}</span>
            {' · '}L{level}
            {' · '}{lines} lines
            {mode === 'ultra' ? ` · ${clock}s` : ''}
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
              {playing ? 'Stacking…' : 'Play ' + mode}
            </button>
          </div>
        </div>
        {pad}
      </div>
    );
  }

  return (
    <div>
      {!playing && (
        <div className="max-w-sm mx-auto mb-3 rounded-3xl border border-emerald-400/30 p-4">
          <div className="text-[10px] uppercase tracking-[2px] opacity-50 mb-2">Choose a mode</div>
          <div className="grid grid-cols-2 gap-2">
            {modes.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`rounded-2xl px-3 py-3 text-sm font-bold border ${
                  mode === m.id ? 'bg-emerald-400 text-black border-emerald-400' : 'border-white/15'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}
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
          {mode === 'ultra' ? ` · ${clock}s` : ''}
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
            {playing ? 'Stacking…' : 'Play ' + mode}
          </button>
        </div>
      </div>
      {pad}
    </div>
  );
}
