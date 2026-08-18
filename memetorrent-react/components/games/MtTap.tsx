'use client';

import { useEffect, useRef, useState } from 'react';
import NightDesk from '@/components/games/NightDesk';
import NightWallet from '@/components/games/NightWallet';

type Mode = 'levels' | 'classic' | 'frenzy' | 'zen' | 'sudden' | 'boss' | 'blitz';
type Dot = { id: number; x: number; y: number; r: number; k: 'mt' | 'rug' | 'gold' | 'heart' | 'freeze' | 'boss'; life: number; max: number; hp?: number };

export default function MtTap() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>('levels');
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [combo, setCombo] = useState(0);
  const [time, setTime] = useState(30);
  const [flash, setFlash] = useState('');
  const [fx, setFx] = useState('');
  const [level, setLevel] = useState(1);
  const [goal, setGoal] = useState(5);
  const [cleared, setCleared] = useState(false);
  const stopRef = useRef(false);

  function spec(n: number) {
    return { time: Math.min(18, 8 + n), goal: 4 + n, rugs: Math.min(0.3, 0.1 + n * 0.012) };
  }

  function pickMode(m: Mode) {
    stopRef.current = true;
    setPlaying(false);
    setCleared(false);
    setMode(m);
  }

  function stopPlay() {
    stopRef.current = true;
    setPlaying(false);
    setCleared(false);
  }
  const wallet = typeof window !== 'undefined' ? localStorage.getItem('mt-racer-wallet') || localStorage.getItem('mt-fruit-wallet') || '' : '';

  useEffect(() => {
    try { setBest(Number(localStorage.getItem('mt-tap-best') || 0)); } catch { /* */ }
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
      h = c.height = Math.max(320, c.clientHeight) * dpr;
    };
    size();
    const dots: Dot[] = [];
    const lv = spec(level);
    let pts = score;
    let lives = mode === 'sudden' ? 1 : 3;
    let left = mode === 'zen' ? 9999 : mode === 'frenzy' ? 20 : mode === 'blitz' ? 12 : mode === 'boss' ? 45 : mode === 'levels' ? lv.time : 30;
    let taps = 0;
    setGoal(lv.goal);
    setTime(left);
    let freeze = 0, x2 = 0;
    let cmb = 0, spawn = 0, nid = 1, last = performance.now();
    let on = true;
    const ping = (f: number) => {
      try {
        const ac = (ping as { ac?: AudioContext }).ac || ((ping as { ac?: AudioContext }).ac = new AudioContext());
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.frequency.value = f;
        g.gain.value = 0.05;
        o.connect(g); g.connect(ac.destination);
        o.start(); o.stop(ac.currentTime + 0.06);
      } catch { /* */ }
    };
    const spawnDot = () => {
      const roll = Math.random();
      let k: Dot['k'] = 'mt';
      if (mode === 'boss' && !dots.some((d) => d.k === 'boss') && roll < 0.35) k = 'boss';
      else if (roll < (mode === 'levels' ? lv.rugs : 0.12)) k = 'rug';
      else if (roll < 0.2) k = 'gold';
      else if (roll < 0.25) k = 'heart';
      else if (roll < 0.29) k = 'freeze';
      const life = k === 'boss' ? 4 : mode === 'frenzy' || mode === 'blitz' ? 0.8 : 1.4;
      dots.push({
        id: nid++,
        x: 0.12 + Math.random() * 0.76,
        y: 0.16 + Math.random() * 0.68,
        r: k === 'boss' ? 0.12 : 0.05 + Math.random() * 0.03,
        k,
        life,
        max: life,
        hp: k === 'boss' ? 6 : 1,
      });
    };
    const hit = (nx: number, ny: number) => {
      for (let i = dots.length - 1; i >= 0; i--) {
        const d = dots[i];
        const pad = wallet ? 1.45 : 1.22;
        if (Math.hypot(nx - d.x, ny - d.y) <= d.r * pad) {
          if (d.k === 'rug') {
            lives -= 1;
            cmb = 0;
            ping(110);
            dots.splice(i, 1);
          } else if (d.k === 'boss') {
            d.hp = (d.hp || 1) - 1;
            ping(300);
            if ((d.hp || 0) > 0) { setFx('BOSS ' + d.hp); return; }
            cmb += 3;
            pts += 25 * (x2 > 0 ? 2 : 1);
            setFlash('$MT');
            dots.splice(i, 1);
          } else {
            if (d.k === 'heart') lives = Math.min(6, lives + 1);
            if (d.k === 'freeze') freeze = 4;
            if (d.k === 'gold') x2 = 6;
            const add = d.k === 'gold' ? 5 : 1;
            cmb += 1;
            taps += 1;
            pts += (add + Math.max(0, cmb - 1)) * (x2 > 0 ? 2 : 1);
            if (mode === 'levels' && taps >= lv.goal) {
              setScore(pts);
              setCleared(true);
              setPlaying(false);
              stopRef.current = true;
              setFlash('LEVEL ' + level);
              return;
            }
            ping(d.k === 'gold' ? 880 : 520 + Math.min(cmb, 10) * 30);
            if (cmb >= 10) setFlash('$MT');
            else if (cmb >= 2) setFlash('$MT x' + cmb);
            setTimeout(() => setFlash(''), cmb >= 10 ? 700 : 380);
            dots.splice(i, 1);
          }
          setScore(pts);
          setCombo(cmb);
          if (lives <= 0 && mode !== 'zen') end(pts);
          return;
        }
      }
    };
    const end = (final: number) => {
      on = false;
      setPlaying(false);
      setScore(final);
      const b = Math.max(best, final);
      setBest(b);
      try { localStorage.setItem('mt-tap-best', String(b)); } catch { /* */ }
      fetch('/api/scores', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: 'tap', score: final }),
      }).catch(() => {});
    };
    const ptr = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      hit((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    };
    c.addEventListener('pointerdown', ptr);
    const loop = (now: number) => {
      if (!on || stopRef.current) return;
      const raw = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (freeze > 0) freeze = Math.max(0, freeze - raw);
      if (x2 > 0) x2 = Math.max(0, x2 - raw);
      setFx([freeze > 0 ? 'FREEZE' : '', x2 > 0 ? 'x2' : '', wallet ? '$MT BLADE' : ''].filter(Boolean).join(' · '));
      const dt = freeze > 0 ? raw * 0.4 : raw;
      if (mode !== 'zen') {
        left -= dt;
        setTime(Math.max(0, left));
        if (left <= 0) end(pts);
      }
      spawn -= dt;
      if (spawn <= 0) {
        spawnDot();
        spawn = mode === 'blitz' ? 0.2 : mode === 'frenzy' ? 0.28 : mode === 'boss' ? 0.55 : 0.48;
      }
      for (let i = dots.length - 1; i >= 0; i--) {
        dots[i].life -= dt;
        if (dots[i].life <= 0) {
          if (dots[i].k !== 'rug' && mode !== 'zen') {
            lives -= 1;
            cmb = 0;
            setCombo(0);
            if (lives <= 0) end(pts);
          }
          dots.splice(i, 1);
        }
      }
      const g = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, h);
      g.addColorStop(0, '#0b2218');
      g.addColorStop(1, '#040c08');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      dots.forEach((d) => {
        const x = d.x * w, y = d.y * h, rad = d.r * Math.min(w, h);
        const a = Math.max(0.25, d.life / d.max);
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fillStyle = d.k === 'rug' ? '#fb7185' : d.k === 'gold' ? '#fbbf24' : d.k === 'heart' ? '#fb7185' : d.k === 'freeze' ? '#38bdf8' : d.k === 'boss' ? '#a78bfa' : '#19d37e';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 18;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#04140c';
        ctx.font = `700 ${Math.round(rad * 0.55)}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const mark = d.k === 'rug' ? '×' : d.k === 'gold' ? '$' : d.k === 'heart' ? '+' : d.k === 'freeze' ? '❄' : d.k === 'boss' ? String(d.hp || '') : 'MT';
        ctx.fillText(mark, x, y);
        ctx.globalAlpha = 1;
      });
      ctx.fillStyle = '#19d37e';
      ctx.font = `800 ${14 * (devicePixelRatio || 1)}px system-ui`;
      ctx.textAlign = 'left';
      ctx.fillText(
        `${pts}   ${'♥'.repeat(Math.max(0, lives))}${mode === 'zen' ? '   ZEN' : '   ' + Math.ceil(left) + 's'}`,
        16,
        24
      );
      requestAnimationFrame(loop);
    };
    const id = requestAnimationFrame(loop);
    return () => {
      on = false;
      cancelAnimationFrame(id);
      c.removeEventListener('pointerdown', ptr);
    };
  }, [playing, mode]);

  return (
    <div>
      {flash && (
        <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center text-emerald-400 font-black tracking-[0.12em] drop-shadow-[0_0_28px_#19d37e] text-6xl sm:text-8xl">
          {flash}
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-3">
        {(['levels', 'classic', 'frenzy', 'zen', 'sudden', 'boss', 'blitz'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => pickMode(m)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${
              mode === m ? 'bg-emerald-400 text-black' : 'border border-white/15'
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <canvas ref={ref} className="w-full h-[58vh] rounded-3xl border border-emerald-400/30 bg-black touch-none" />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div>
          Score <span className="text-emerald-400 font-mono">{score}</span>
          {combo >= 2 && <span className="ml-2 font-black text-emerald-400">$MT x{combo}</span>}
          {fx && <span className="ml-2 text-emerald-300">{fx}</span>}
          <span className="opacity-50 ml-3">best {best}</span>
          {mode === 'levels' && (
            <span className="ml-3 text-emerald-300">
              Lv {level} · {goal} taps
            </span>
          )}
          {playing && mode !== 'zen' && <span className="ml-3 opacity-60">{Math.ceil(time)}s</span>}
        </div>
        <div className="flex gap-2">
          {playing && (
            <button type="button" onClick={stopPlay} className="rounded-full border border-white/20 px-4 py-2">
              Stop
            </button>
          )}
          {cleared && mode === 'levels' && (
            <button
              type="button"
              onClick={() => { setLevel((n) => n + 1); setCleared(false); setPlaying(true); }}
              className="rounded-full bg-emerald-400 text-black font-bold px-5 py-2"
            >
              Level {level + 1}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              stopRef.current = false;
              if (mode === 'levels' && !cleared && !playing) setScore(0);
              if (mode !== 'levels') setScore(0);
              setCombo(0);
              setCleared(false);
              setPlaying(true);
            }}
            className="rounded-full bg-emerald-400 text-black font-bold px-5 py-2"
          >
            {playing ? 'Tapping…' : cleared ? 'Replay level' : mode === 'levels' ? `Start level ${level}` : 'Tap on'}
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs opacity-50">
        Levels (tap goal + clock) · Classic · Frenzy · Zen (hit Stop to leave) · Sudden · Boss · Blitz.
        Green MT · gold $ · pink + life · blue freeze · purple boss. Wallet = fatter taps.
      </p>
      <div className="mt-6 max-w-md">
        <NightWallet name="" />
      </div>
      <NightDesk />
    </div>
  );
}
