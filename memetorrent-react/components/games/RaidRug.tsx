'use client';

import { useEffect, useState } from 'react';


type State = {
  code: string;
  phase: string;
  ends_in: number;
  players: string[];
  votes: Record<string, string>;
  rug: string | null;
};

export default function RaidRug() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [room, setRoom] = useState<State | null>(null);
  const [secret, setSecret] = useState<boolean | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const s = localStorage.getItem('mt-raid-name') || '';
    setName(s);
  }, []);

  useEffect(() => {
    if (!code) return;
    const pull = () => {
      fetch('/api/games/raid?code=' + encodeURIComponent(code))
        .then((r) => r.json())
        .then((d) => {
          if (d.ok) setRoom(d);
        })
        .catch(() => {});
    };
    pull();
    const t = setInterval(pull, 1200);
    return () => clearInterval(t);
  }, [code]);

  async function call(action: string, extra: Record<string, unknown> = {}) {
    const res = await fetch('/api/games/raid', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, name, code, ...extra }),
    });
    return res.json();
  }

  return (
    <div>
      {!room && (
        <div className="rounded-3xl border border-white/10 p-6 bg-black/40 space-y-3 max-w-md">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Handle" className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2" />
          <button
            className="w-full rounded-full bg-emerald-400 text-black font-bold py-2"
            onClick={async () => {
              localStorage.setItem('mt-raid-name', name);
              const d = await call('create');
              if (d.code) setCode(d.code);
              else setMsg(d.error);
            }}
          >
            Open a vault
          </button>
          <div className="flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CODE" className="flex-1 rounded-lg bg-white/5 border border-white/15 px-3 py-2 uppercase" />
            <button
              className="rounded-full border border-white/20 px-4"
              onClick={async () => {
                localStorage.setItem('mt-raid-name', name);
                const d = await call('join');
                if (!d.ok) setMsg(d.error);
              }}
            >
              Join
            </button>
          </div>
          {msg && <p className="text-sm opacity-70">{msg}</p>}
        </div>
      )}

      {room && (
        <div className="rounded-3xl border border-emerald-400/30 p-6 bg-black/50">
          <div className="flex justify-between text-sm mb-4">
            <span className="font-mono text-emerald-400 text-xl">{room.code}</span>
            <span className="uppercase tracking-[2px] opacity-50">{room.phase}</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {room.players.map((p) => (
              <span key={p} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm">{p}</span>
            ))}
          </div>
          {room.phase === 'lobby' && (
            <button className="rounded-full bg-emerald-400 text-black font-bold px-5 py-2" onClick={() => call('start')}>
              Seal the vault (8:00)
            </button>
          )}
          {room.phase === 'play' && (
            <div>
              <p className="text-3xl font-black tabular-nums text-emerald-400">{Math.floor(room.ends_in / 60)}:{(room.ends_in % 60).toString().padStart(2, '0')}</p>
              <button className="mt-3 text-sm underline opacity-70" onClick={async () => {
                const d = await call('me');
                setSecret(!!d.rug);
              }}>
                Check your role
              </button>
              {secret === true && <p className="mt-2 text-red-400 font-bold">You are the intern. Don’t get voted.</p>}
              {secret === false && <p className="mt-2 text-emerald-300">You are diamond. Find the intern.</p>}
            </div>
          )}
          {(room.phase === 'vote' || (room.phase === 'play' && room.ends_in === 0)) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {room.players.map((p) => (
                <button key={p} className="rounded-full border border-white/20 px-3 py-2" onClick={() => call('vote', { target: p })}>
                  Vote {p}
                </button>
              ))}
            </div>
          )}
          {room.phase === 'end' && (
            <p className="mt-4 text-lg">The intern was <span className="text-emerald-400 font-bold">{room.rug}</span>.</p>
          )}
        </div>
      )}

    </div>
  );
}
