'use client';

import { useRef, useState } from 'react';

const ROWS = ['kick', 'snare', 'hat', 'tone'];
const COLS = 16;

export default function StudioJam() {
  const [grid, setGrid] = useState(() => ROWS.map(() => Array(COLS).fill(false)));
  const [beat, setBeat] = useState(-1);
  const playing = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  function hit(row: number, col: number) {
    setGrid((g) => g.map((r, i) => (i === row ? r.map((v, j) => (j === col ? !v : v)) : r)));
  }

  function beep(kind: string, t: number, ac: AudioContext) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = kind === 'kick' ? 'sine' : kind === 'snare' ? 'triangle' : kind === 'hat' ? 'square' : 'sawtooth';
    o.frequency.value = kind === 'kick' ? 70 : kind === 'snare' ? 220 : kind === 'hat' ? 880 : 330;
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(g); g.connect(ac.destination);
    o.start(t); o.stop(t + 0.14);
  }

  function play() {
    const ac = ctxRef.current || new AudioContext();
    ctxRef.current = ac;
    if (playing.current) { clearInterval(playing.current); playing.current = null; setBeat(-1); return; }
    let i = 0;
    const step = () => {
      setBeat(i);
      const now = ac.currentTime;
      ROWS.forEach((kind, r) => {
        if (grid[r][i]) beep(kind, now, ac);
      });
      i = (i + 1) % COLS;
    };
    step();
    playing.current = window.setInterval(step, 140);
  }

  return (
    <div>
      <div className="rounded-3xl border border-white/10 bg-black/50 p-4 overflow-x-auto">
        {ROWS.map((row, r) => (
          <div key={row} className="flex items-center gap-1 mb-1">
            <span className="w-14 text-[10px] uppercase opacity-50">{row}</span>
            {grid[r].map((on, c) => (
              <button
                key={c}
                type="button"
                onClick={() => hit(r, c)}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border ${
                  beat === c ? 'border-white' : 'border-white/10'
                } ${on ? 'bg-emerald-400' : 'bg-white/5'}`}
              />
            ))}
          </div>
        ))}
      </div>
      <button type="button" onClick={play} className="mt-4 rounded-full bg-emerald-400 text-black font-black px-6 py-2">
        {playing.current ? 'Stop' : 'Play loop'}
      </button>

    </div>
  );
}
