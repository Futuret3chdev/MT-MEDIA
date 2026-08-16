'use client';

import { useEffect, useState } from 'react';

type Msg = { id: number; username: string; body: string; created_at: string };
const ROOMS = [
  { id: 'trades', label: 'Trades' },
  { id: 'general', label: 'General' },
  { id: 'support', label: 'Support' },
];

export default function ChatPage() {
  const [room, setRoom] = useState('trades');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [authed, setAuthed] = useState(false);

  const load = () => {
    fetch(`/api/chat?room=${room}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setMsgs(d.messages || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetch('/api/portal/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setAuthed(!!d.user));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [room]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ room, text }),
    });
    const data = await res.json();
    if (!data.ok) {
      setErr(data.error || 'Could not send');
      return;
    }
    setText('');
    load();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-2">Crypto chat</div>
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Trades. Not another Telegram clone.</h1>
      <p className="text-sm opacity-70 mb-6">
        Portal login only. Rooms for trades, general and support. Web first — Android / Windows
        clients come with the studio pack.
      </p>
      <div className="flex gap-2 mb-4">
        {ROOMS.map((r) => (
          <button
            key={r.id}
            onClick={() => setRoom(r.id)}
            className={`px-3 py-1 rounded-full text-sm ${
              room === r.id ? 'bg-emerald-400 text-black font-semibold' : 'border border-white/15 opacity-70'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 h-[420px] overflow-y-auto p-4 space-y-3 bg-black/30">
        {msgs.map((m) => (
          <div key={m.id}>
            <div className="text-[11px] text-emerald-400">
              {m.username}{' '}
              <span className="opacity-40">{new Date(m.created_at).toLocaleTimeString()}</span>
            </div>
            <div className="text-sm">{m.body}</div>
          </div>
        ))}
        {!msgs.length && <div className="text-sm opacity-40">No messages yet in #{room}.</div>}
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={authed ? `Message #${room}` : 'Sign in via the account icon to chat'}
          disabled={!authed}
          className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-sm"
        />
        <button
          disabled={!authed || !text.trim()}
          className="font-semibold text-black bg-emerald-400 disabled:opacity-40 px-4 rounded-xl text-sm"
        >
          Send
        </button>
      </form>
      {err && <div className="text-sm text-red-400 mt-2">{err}</div>}
    </div>
  );
}
