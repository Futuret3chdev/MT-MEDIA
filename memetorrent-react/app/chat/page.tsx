'use client';

import { useEffect, useRef, useState } from 'react';
import BackBar from '@/components/ui/BackBar';

type Msg = {
  id: number;
  username: string;
  body: string;
  created_at: string;
  burn_at?: string | null;
  no_forward?: number;
  kind?: string;
};
type Chan = { slug: string; name: string; kind: string; gate_note: string | null };

function renderBody(text: string) {
  const parts = text.split(/(\$[A-Za-z0-9]+|0x[a-fA-F0-9]{6,}|[1-9A-HJ-NP-Za-km-z]{32,44})/g);
  return parts.map((p, i) => {
    if (p.startsWith('$') || p.startsWith('0x') || (p.length >= 32 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(p))) {
      return (
        <span key={i} className="text-emerald-400 font-mono break-all">
          {p}
        </span>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

export default function ChatPage() {
  const [channels, setChannels] = useState<Chan[]>([]);
  const [room, setRoom] = useState('trades');
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [events, setEvents] = useState<{ event_name: string; payload: string }[]>([]);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [authed, setAuthed] = useState(false);
  const [who, setWho] = useState('');
  const [wallet, setWallet] = useState('');
  const [persona, setPersona] = useState<'public' | 'stealth'>('public');
  const [burn, setBurn] = useState(0);
  const [noFwd, setNoFwd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKind, setNewKind] = useState('public');
  const end = useRef<HTMLDivElement>(null);

  const current = channels.find((c) => c.slug === room);

  const loadChans = () => {
    fetch('/api/chat/channels', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setChannels(d.channels || []));
  };

  const load = () => {
    fetch(`/api/chat?room=${room}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setMsgs(d.messages || []));
    fetch(`/api/chat/events?room=${room}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setEvents(d.events || []));
  };

  useEffect(() => {
    fetch('/api/portal/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setAuthed(!!d.user);
        setWho(d.user?.username || '');
        setWallet(d.user?.wallet_address || '');
      });
    loadChans();
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
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, text, burn, no_forward: noFwd, persona }),
    });
    const data = await res.json();
    if (!data.ok) {
      setErr(data.error || 'Could not send');
      return;
    }
    setText('');
    load();
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/chat/channels', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, kind: newKind }),
    });
    const data = await res.json();
    if (!data.ok) {
      setErr(data.error || 'Could not create');
      return;
    }
    setCreating(false);
    setNewName('');
    loadChans();
    setRoom(data.slug);
    setOpen(true);
  };

  const emit = async () => {
    await fetch('/api/chat/events', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, event: 'MatchWon', payload: { score: 1 } }),
    });
    load();
  };

  const chrome = persona === 'stealth' ? 'bg-[#080808]' : 'bg-[#0b0d12]';

  return (
    <div className={`max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8 ${persona === 'stealth' ? 'text-zinc-200' : ''}`}>
      <BackBar links={[{ href: '/portal', label: 'Portal' }]} />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">MT Chat</h1>
        <button
          type="button"
          onClick={() => setPersona((p) => (p === 'public' ? 'stealth' : 'public'))}
          className="text-xs px-3 py-2 rounded-full border border-white/20 min-h-[40px]"
        >
          {persona === 'public' ? 'Public' : 'Stealth'} · tap to switch
        </button>
      </div>

      <div className={`rounded-2xl border border-white/10 overflow-hidden grid md:grid-cols-[280px_1fr] min-h-[72vh] ${chrome}`}>
        <aside className={`${open ? 'hidden' : 'block'} md:block border-r border-white/10`}>
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider opacity-40">Channels</span>
            <button
              type="button"
              className="text-emerald-400 text-lg leading-none"
              onClick={() => setCreating((v) => !v)}
              title="New channel"
            >
              +
            </button>
          </div>
          {creating && (
            <form onSubmit={create} className="px-3 pb-3 space-y-2">
              <input
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="# channel name"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-sm"
              />
              <select
                value={newKind}
                onChange={(e) => setNewKind(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-sm"
              >
                <option value="public">Public</option>
                <option value="gated">Token-gated</option>
                <option value="secret">Secret</option>
              </select>
              <button className="w-full py-2 rounded-xl bg-emerald-400 text-black text-sm font-semibold">
                Create
              </button>
            </form>
          )}
          {channels.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => {
                setRoom(c.slug);
                setOpen(true);
              }}
              className={`w-full text-left px-4 py-3 border-b border-white/5 ${
                room === c.slug ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <div className="font-semibold text-sm">#{c.name}</div>
              <div className="text-[11px] opacity-50 capitalize">
                {c.kind}
                {c.gate_note ? ` · ${c.gate_note}` : ''}
              </div>
            </button>
          ))}
        </aside>

        <section className={`${open ? 'flex' : 'hidden'} md:flex flex-col min-h-[72vh]`}>
          <header className="px-3 sm:px-4 py-3 border-b border-white/10 flex items-center gap-3">
            <button type="button" className="md:hidden text-sm min-h-[40px]" onClick={() => setOpen(false)}>
              ← Channels
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">#{current?.name || room}</div>
              <div className="text-xs opacity-50 capitalize">{current?.kind || 'public'}</div>
            </div>
            <button type="button" onClick={emit} className="text-[11px] opacity-50 hidden sm:inline">
              Post event
            </button>
          </header>
          {!!events.length && (
            <div className="px-3 py-2 border-b border-white/5 text-[11px] text-emerald-400">
              Latest event: {events[events.length - 1]?.event_name}
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
            {msgs.map((m) => (
              <div key={m.id} className={m.username === who || m.username.startsWith('0xStealth') ? 'text-right' : ''}>
                <div className="text-[11px] text-emerald-400">
                  {m.username}
                  {m.no_forward ? ' · no forward' : ''}
                  {m.burn_at ? ' · burns' : ''}{' '}
                  <span className="opacity-40">{new Date(m.created_at).toLocaleTimeString()}</span>
                </div>
                <div
                  className={`inline-block text-sm text-left max-w-[85%] rounded-2xl px-3 py-2 ${
                    m.kind === 'event' ? 'border border-emerald-400/40' : 'bg-white/5'
                  }`}
                >
                  {m.kind === 'asset' && (
                    <div className="text-[10px] uppercase tracking-wider opacity-50 mb-1">Asset</div>
                  )}
                  {renderBody(m.body)}
                </div>
              </div>
            ))}
            {!msgs.length && <div className="text-sm opacity-40">No messages yet. Start the room.</div>}
            <div ref={end} />
          </div>
          <form onSubmit={send} className="p-3 border-t border-white/10 space-y-2">
            <div className="flex flex-wrap gap-2">
              <select
                value={burn}
                onChange={(e) => setBurn(Number(e.target.value))}
                className="text-xs px-2 py-2 rounded-xl bg-black/40 border border-white/15"
              >
                <option value={0}>Keep</option>
                <option value={30}>Burn 30s</option>
                <option value={300}>Burn 5m</option>
                <option value={3600}>Burn 1h</option>
                <option value={86400}>Burn 1d</option>
              </select>
              <label className="text-xs flex items-center gap-1 opacity-70">
                <input type="checkbox" checked={noFwd} onChange={(e) => setNoFwd(e.target.checked)} />
                No forward
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={authed ? `Message #${current?.name || room}` : 'Sign in to send'}
                disabled={!authed}
                className="flex-1 min-w-[140px] px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm"
              />
              {wallet && (
                <button
                  type="button"
                  className="text-xs px-3 py-2 rounded-xl border border-white/15"
                  onClick={() => setText((t) => (t ? `${t} ` : '') + wallet)}
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
            </div>
            {err && <div className="text-sm text-red-400">{err}</div>}
          </form>
        </section>
      </div>
    </div>
  );
}
