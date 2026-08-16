'use client';

import { useEffect, useRef, useState } from 'react';
import BackBar from '@/components/ui/BackBar';

type Msg = { id: number; username: string; body: string; created_at: string };

const ROOMS = [
  { id: 'trades', label: 'Trades', sub: 'Fills and pairs' },
  { id: 'signals', label: 'Signals', sub: 'Calls and alerts' },
  { id: 'otc', label: 'OTC', sub: 'Desk and size' },
  { id: 'general', label: 'General', sub: 'The floor' },
  { id: 'support', label: 'Support', sub: 'Help' },
];

function renderBody(text: string) {
  const parts = text.split(/(\$[A-Za-z0-9]+|0x[a-fA-F0-9]{8,}|[1-9A-HJ-NP-Za-km-z]{32,44})/g);
  return parts.map((p, i) => {
    if (p.startsWith('$') || p.startsWith('0x') || (p.length >= 32 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(p))) {
      return (
        <span key={i} className="text-emerald-400 font-mono">
          {p}
        </span>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

export default function ChatPage() {
  const [room, setRoom] = useState('trades');
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [authed, setAuthed] = useState(false);
  const [who, setWho] = useState('');
  const [wallet, setWallet] = useState('');
  const end = useRef<HTMLDivElement>(null);

  const load = () => {
    fetch(`/api/chat?room=${room}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setMsgs(d.messages || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetch('/api/portal/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setAuthed(!!d.user);
        setWho(d.user?.username || '');
        setWallet(d.user?.wallet_address || '');
      });
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [room]);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length]);

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

  const current = ROOMS.find((r) => r.id === room)!;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
      <BackBar links={[{ href: '/portal', label: 'Portal' }]} />
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">MT Chat</h1>

      <div className="rounded-2xl border border-white/10 overflow-hidden grid md:grid-cols-[260px_1fr] min-h-[70vh] bg-[#0b0d12]">
        <aside className={`${open ? 'hidden' : 'block'} md:block border-r border-white/10`}>
          <div className="px-4 py-3 text-xs uppercase tracking-wider opacity-40">Rooms</div>
          {ROOMS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setRoom(r.id);
                setOpen(true);
              }}
              className={`w-full text-left px-4 py-3 border-b border-white/5 ${
                room === r.id ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <div className="font-semibold text-sm">{r.label}</div>
              <div className="text-xs opacity-50">{r.sub}</div>
            </button>
          ))}
        </aside>

        <section className={`${open ? 'flex' : 'hidden'} md:flex flex-col min-h-[70vh]`}>
          <header className="px-3 sm:px-4 py-3 border-b border-white/10 flex items-center gap-3">
            <button
              type="button"
              className="md:hidden text-sm opacity-70 min-h-[40px]"
              onClick={() => setOpen(false)}
            >
              ← Rooms
            </button>
            <div>
              <div className="font-semibold">{current.label}</div>
              <div className="text-xs opacity-50">{current.sub}</div>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
            {msgs.map((m) => (
              <div key={m.id} className={m.username === who ? 'text-right' : ''}>
                <div className="text-[11px] text-emerald-400">
                  {m.username}{' '}
                  <span className="opacity-40">{new Date(m.created_at).toLocaleTimeString()}</span>
                </div>
                <div className="inline-block text-sm text-left max-w-[85%] rounded-2xl px-3 py-2 bg-white/5">
                  {renderBody(m.body)}
                </div>
              </div>
            ))}
            {!msgs.length && <div className="text-sm opacity-40">No messages yet.</div>}
            <div ref={end} />
          </div>
          <form onSubmit={send} className="p-3 border-t border-white/10 flex flex-wrap gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={authed ? `Message ${current.label}` : 'Sign in to send'}
              disabled={!authed}
              className="flex-1 min-w-[160px] px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm"
            />
            {wallet && (
              <button
                type="button"
                className="text-xs px-3 py-2 rounded-xl border border-white/15"
                onClick={() => setText((t) => (t ? t + ' ' : '') + wallet)}
              >
                Wallet
              </button>
            )}
            <button
              disabled={!authed || !text.trim()}
              className="font-semibold text-black bg-emerald-400 disabled:opacity-40 px-4 rounded-xl text-sm min-h-[40px]"
            >
              Send
            </button>
          </form>
          {err && <div className="text-sm text-red-400 px-3 pb-2">{err}</div>}
        </section>
      </div>
    </div>
  );
}
