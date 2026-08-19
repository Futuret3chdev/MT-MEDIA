'use client';

import { useEffect, useRef, useState } from 'react';

type Tool = 'skin' | 'scores' | 'input' | 'party' | 'clock' | 'cover' | 'pads' | 'bracket';

export default function GameSuite() {
  const [tool, setTool] = useState<Tool>('skin');

  useEffect(() => {
    const h = location.hash.replace('#', '') as Tool;
    if (['skin', 'scores', 'input', 'party', 'clock', 'cover', 'pads', 'bracket'].includes(h)) setTool(h);
  }, []);

  function pick(id: Tool) {
    setTool(id);
    history.replaceState(null, '', '#' + id);
  }

  const cards: { id: Tool; name: string; desc: string }[] = [
    { id: 'skin', name: 'Skin Lab', desc: 'Pick body and shirt hex. Preview the mint runner. Copy for World dress.' },
    { id: 'scores', name: 'Score Book', desc: 'Log runs on this device. Search and export JSON.' },
    { id: 'input', name: 'Input Lab', desc: 'See keys, pointer, and gamepad so pads work before a night.' },
    { id: 'party', name: 'Party Codes', desc: 'Mint a four-letter room code and a share link.' },
    { id: 'clock', name: 'Night Clock', desc: 'Countdown for community nights. Start, pause, reset.' },
    { id: 'cover', name: 'Cover Stamp', desc: 'Drop an image. Stamp $MT on it. Download the cover.' },
    { id: 'pads', name: 'Pad Kit', desc: 'Eight pads. Tap to play a bar. Use it for Jam practice.' },
    { id: 'bracket', name: 'Bracket', desc: 'Four or eight names. Fill, shuffle, mark winners.' },
  ];

  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4">
        {cards.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => pick(t.id)}
            className={`text-left rounded-2xl border p-6 bg-white/[0.02] ${
              tool === t.id ? 'border-emerald-400/50' : 'border-white/10'
            }`}
          >
            <h2 className="text-xl font-semibold mb-2">{t.name}</h2>
            <p className="text-sm opacity-70 mb-3">{t.desc}</p>
            <div className="text-xs text-emerald-400">{tool === t.id ? 'Open below' : 'Open tool →'}</div>
          </button>
        ))}
      </div>
      <div className="mt-8 rounded-3xl border border-white/10 p-6 bg-white/[0.02]">
        {tool === 'skin' && <SkinLab />}
        {tool === 'scores' && <ScoreBook />}
        {tool === 'input' && <InputLab />}
        {tool === 'party' && <PartyCodes />}
        {tool === 'clock' && <NightClock />}
        {tool === 'cover' && <CoverStamp />}
        {tool === 'pads' && <PadKit />}
        {tool === 'bracket' && <Bracket />}
      </div>
    </div>
  );
}

function SkinLab() {
  const [body, setBody] = useState('19d37e');
  const [shirt, setShirt] = useState('052e16');
  const [copy, setCopy] = useState('');

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Skin Lab</h3>
      <p className="text-sm opacity-70 mb-4">Colors stay here. Paste them into World dress or Jump notes.</p>
      <div className="flex flex-wrap gap-6 items-center">
        <canvas
          width={96}
          height={72}
          ref={(c) => {
            if (!c) return;
            const ctx = c.getContext('2d');
            if (!ctx) return;
            ctx.clearRect(0, 0, 96, 72);
            ctx.fillStyle = '#04140c';
            ctx.fillRect(0, 0, 96, 72);
            ctx.fillStyle = '#' + shirt;
            ctx.fillRect(38, 28, 20, 22);
            ctx.fillStyle = '#' + body;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const a = Math.PI / 6 + i * Math.PI / 3;
              const x = 48 + Math.cos(a) * 16;
              const y = 22 + Math.sin(a) * 16;
              if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 8px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('$MT', 48, 25);
          }}
          className="rounded-xl border border-white/10"
        />
        <div className="space-y-2 text-sm">
          <label className="block">Body <input value={body} onChange={(e) => setBody(e.target.value.replace('#', ''))} className="ml-2 rounded-lg bg-black/40 border border-white/15 px-2 py-1 font-mono w-28" /></label>
          <label className="block">Shirt <input value={shirt} onChange={(e) => setShirt(e.target.value.replace('#', ''))} className="ml-2 rounded-lg bg-black/40 border border-white/15 px-2 py-1 font-mono w-28" /></label>
          <button
            type="button"
            onClick={() => {
              const t = `body ${body} · shirt ${shirt}`;
              navigator.clipboard?.writeText(t).catch(() => {});
              setCopy(t);
            }}
            className="rounded-full bg-emerald-400 text-black font-bold px-4 py-1.5"
          >
            Copy hex
          </button>
          {copy && <div className="text-xs opacity-60">{copy}</div>}
        </div>
      </div>
    </div>
  );
}

type Row = { id: string; game: string; score: number; note: string; at: number };

function ScoreBook() {
  const [rows, setRows] = useState<Row[]>([]);
  const [game, setGame] = useState('mtjump');
  const [score, setScore] = useState('');
  const [note, setNote] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    try { setRows(JSON.parse(localStorage.getItem('mt-scorebook') || '[]')); } catch { /* */ }
  }, []);

  function save(next: Row[]) {
    setRows(next);
    try { localStorage.setItem('mt-scorebook', JSON.stringify(next)); } catch { /* */ }
  }

  const shown = rows.filter((r) => !q || (r.game + r.note).toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Score Book</h3>
      <p className="text-sm opacity-70 mb-4">Your book on this device. Export when you want a backup.</p>
      <div className="grid sm:grid-cols-3 gap-2 mb-3">
        <input value={game} onChange={(e) => setGame(e.target.value)} placeholder="Game" className="rounded-xl bg-black/40 border border-white/15 px-3 py-2" />
        <input value={score} onChange={(e) => setScore(e.target.value)} placeholder="Score" type="number" className="rounded-xl bg-black/40 border border-white/15 px-3 py-2" />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" className="rounded-xl bg-black/40 border border-white/15 px-3 py-2" />
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <button type="button" onClick={() => {
          const n = Number(score);
          if (!game.trim() || !Number.isFinite(n)) return;
          save([{ id: String(Date.now()), game: game.trim(), score: n, note, at: Date.now() }, ...rows]);
          setScore(''); setNote('');
        }} className="rounded-full bg-emerald-400 text-black font-bold px-5 py-2">Add run</button>
        <button type="button" onClick={() => {
          const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'mt-scorebook.json';
          a.click();
        }} className="rounded-full border border-white/20 px-4 py-2 text-sm">Export</button>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="w-full rounded-xl bg-black/40 border border-white/15 px-3 py-2 mb-3" />
      <ul className="space-y-2 text-sm">
        {shown.map((r) => (
          <li key={r.id} className="flex justify-between gap-2 rounded-xl border border-white/10 px-3 py-2">
            <span><b>{r.game}</b> · {r.score} {r.note && <span className="opacity-50">· {r.note}</span>}</span>
            <button type="button" className="text-xs opacity-50" onClick={() => save(rows.filter((x) => x.id !== r.id))}>drop</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InputLab() {
  const [keys, setKeys] = useState<string[]>([]);
  const [pad, setPad] = useState('No gamepad yet. Press a button.');
  const [xy, setXy] = useState('Move here');

  useEffect(() => {
    const down = (e: KeyboardEvent) => setKeys((k) => Array.from(new Set([e.code, ...k])).slice(0, 8));
    const up = (e: KeyboardEvent) => setKeys((k) => k.filter((x) => x !== e.code));
    let on = true;
    const loop = () => {
      if (!on) return;
      const g = navigator.getGamepads?.()[0];
      if (g) {
        const btns = g.buttons.map((b, i) => (b.pressed ? i : -1)).filter((i) => i >= 0);
        setPad(`${g.id.slice(0, 28)} · buttons ${btns.join(',') || '—'} · axes ${g.axes.map((a) => a.toFixed(2)).join(' ')}`);
      }
      requestAnimationFrame(loop);
    };
    addEventListener('keydown', down);
    addEventListener('keyup', up);
    const id = requestAnimationFrame(loop);
    return () => { on = false; removeEventListener('keydown', down); removeEventListener('keyup', up); cancelAnimationFrame(id); };
  }, []);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Input Lab</h3>
      <p className="text-sm opacity-70 mb-4">Tap keys, drag, or press a pad. This tab only.</p>
      <div
        onPointerMove={(e) => setXy(`${Math.round(e.nativeEvent.offsetX)}, ${Math.round(e.nativeEvent.offsetY)}`)}
        className="h-28 rounded-2xl border border-emerald-400/30 mb-3 grid place-items-center text-sm"
      >
        {xy}
      </div>
      <div className="text-sm mb-2">Keys: {keys.join(' · ') || '—'}</div>
      <div className="text-xs font-mono opacity-70">{pad}</div>
    </div>
  );
}

function PartyCodes() {
  const [code, setCode] = useState('');
  const [link, setLink] = useState('');

  function mint() {
    const c = Math.random().toString(36).slice(2, 6).toUpperCase();
    setCode(c);
    setLink(location.origin + '/mtjump?room=' + c);
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Party Codes</h3>
      <p className="text-sm opacity-70 mb-4">Share a room for Jump Coin Rush or a night desk.</p>
      <button type="button" onClick={mint} className="rounded-full bg-emerald-400 text-black font-bold px-5 py-2 mb-3">New code</button>
      {code && (
        <div className="text-sm">
          <div className="text-3xl font-black tracking-[6px] text-emerald-400 mb-2">{code}</div>
          <button type="button" className="text-xs underline opacity-70" onClick={() => navigator.clipboard?.writeText(link)}>Copy link</button>
          <div className="mt-1 font-mono text-xs break-all opacity-50">{link}</div>
        </div>
      )}
    </div>
  );
}

function NightClock() {
  const [sec, setSec] = useState(300);
  const [left, setLeft] = useState(300);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => setLeft((s) => (s <= 1 ? (setOn(false), 0) : s - 1)), 1000);
    return () => clearInterval(id);
  }, [on]);

  const m = Math.floor(left / 60);
  const s = String(left % 60).padStart(2, '0');

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Night Clock</h3>
      <p className="text-sm opacity-70 mb-4">Set minutes, then run the desk clock.</p>
      <div className="text-5xl font-black text-emerald-400 mb-4">{m}:{s}</div>
      <div className="flex flex-wrap gap-2">
        {[1, 3, 5, 10].map((n) => (
          <button key={n} type="button" onClick={() => { setSec(n * 60); setLeft(n * 60); setOn(false); }} className="rounded-full border border-white/20 px-3 py-1 text-sm">{n}m</button>
        ))}
        <button type="button" onClick={() => setOn((v) => !v)} className="rounded-full bg-emerald-400 text-black font-bold px-5 py-2">{on ? 'Pause' : 'Start'}</button>
        <button type="button" onClick={() => { setLeft(sec); setOn(false); }} className="rounded-full border border-white/20 px-4 py-2 text-sm">Reset</button>
      </div>
    </div>
  );
}

function CoverStamp() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [msg, setMsg] = useState('Drop or pick an image.');

  function draw(img: HTMLImageElement) {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    c.width = 960; c.height = 540;
    ctx.fillStyle = '#04140c';
    ctx.fillRect(0, 0, 960, 540);
    const s = Math.max(960 / img.width, 540 / img.height);
    const w = img.width * s, h = img.height * s;
    ctx.drawImage(img, (960 - w) / 2, (540 - h) / 2, w, h);
    ctx.fillStyle = 'rgba(4,20,12,.55)';
    ctx.fillRect(0, 460, 960, 80);
    ctx.fillStyle = '#19d37e';
    ctx.font = 'bold 36px system-ui';
    ctx.fillText('$MT', 28, 512);
    ctx.fillStyle = '#e8fff4';
    ctx.font = '16px system-ui';
    ctx.fillText('MT-ECO SYSTEM', 140, 510);
    setMsg('Ready. Download the stamp.');
  }

  function load(file: File) {
    const img = new Image();
    img.onload = () => draw(img);
    img.src = URL.createObjectURL(file);
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Cover Stamp</h3>
      <p className="text-sm opacity-70 mb-4">{msg}</p>
      <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); }} className="mb-3 text-sm" />
      <canvas ref={ref} className="w-full max-w-xl rounded-2xl border border-white/10 bg-black block mb-3" />
      <button type="button" onClick={() => {
        const c = ref.current; if (!c) return;
        const a = document.createElement('a');
        a.href = c.toDataURL('image/jpeg', 0.9);
        a.download = 'mt-cover.jpg';
        a.click();
      }} className="rounded-full bg-emerald-400 text-black font-bold px-5 py-2">Download $MT cover</button>
    </div>
  );
}

function PadKit() {
  const [last, setLast] = useState('');
  const notes = [261, 293, 329, 349, 392, 440, 493, 523];

  function hit(i: number) {
    setLast('Pad ' + (i + 1));
    try {
      const ac = new AudioContext();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.frequency.value = notes[i];
      g.gain.value = 0.08;
      o.connect(g); g.connect(ac.destination);
      o.start(); o.stop(ac.currentTime + 0.18);
    } catch { /* */ }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Pad Kit</h3>
      <p className="text-sm opacity-70 mb-4">Eight tones. Practice a bar for Studio Jam. {last}</p>
      <div className="grid grid-cols-4 gap-2 max-w-md">
        {notes.map((_, i) => (
          <button key={i} type="button" onPointerDown={() => hit(i)} className="h-16 rounded-2xl bg-emerald-400/20 border border-emerald-400/40 font-black">
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

function Bracket() {
  const [names, setNames] = useState(['', '', '', '']);
  const [win, setWin] = useState<(string | null)[]>([null, null, null]);

  function set(i: number, v: string) {
    const n = [...names]; n[i] = v; setNames(n);
  }
  const a = names[0] || 'A', b = names[1] || 'B', c = names[2] || 'C', d = names[3] || 'D';
  const s1 = win[0], s2 = win[1], fin = win[2];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Bracket</h3>
      <p className="text-sm opacity-70 mb-4">Four players. Tap the winner of each pair.</p>
      <div className="grid sm:grid-cols-2 gap-2 mb-4">
        {names.map((n, i) => (
          <input key={i} value={n} onChange={(e) => set(i, e.target.value)} placeholder={'Player ' + (i + 1)} className="rounded-xl bg-black/40 border border-white/15 px-3 py-2" />
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <button type="button" onClick={() => setWin(['', '', ''].map(() => null))} className="rounded-full border border-white/20 px-4 py-2 text-sm">Clear winners</button>
        <button type="button" onClick={() => {
          const n = [...names];
          for (let i = n.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [n[i], n[j]] = [n[j], n[i]]; }
          setNames(n); setWin([null, null, null]);
        }} className="rounded-full border border-white/20 px-4 py-2 text-sm">Shuffle</button>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl border border-white/10 p-3">
          <div className="opacity-50 text-xs mb-2">Semi 1</div>
          <button type="button" className="block w-full text-left py-1" onClick={() => setWin([a, win[1], null])}>{a}</button>
          <button type="button" className="block w-full text-left py-1" onClick={() => setWin([b, win[1], null])}>{b}</button>
          <div className="text-emerald-400 mt-1">{s1 || '—'}</div>
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <div className="opacity-50 text-xs mb-2">Semi 2</div>
          <button type="button" className="block w-full text-left py-1" onClick={() => setWin([win[0], c, null])}>{c}</button>
          <button type="button" className="block w-full text-left py-1" onClick={() => setWin([win[0], d, null])}>{d}</button>
          <div className="text-emerald-400 mt-1">{s2 || '—'}</div>
        </div>
        <div className="rounded-xl border border-emerald-400/30 p-3">
          <div className="opacity-50 text-xs mb-2">Final</div>
          <button type="button" className="block w-full text-left py-1" onClick={() => setWin([win[0], win[1], s1])}>{s1 || 'TBD'}</button>
          <button type="button" className="block w-full text-left py-1" onClick={() => setWin([win[0], win[1], s2])}>{s2 || 'TBD'}</button>
          <div className="text-amber-300 mt-1 font-black">{fin || '—'}</div>
        </div>
      </div>
    </div>
  );
}
