'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import BackBar from '@/components/ui/BackBar';
import RequireLogin from '@/components/auth/RequireLogin';

type Msg = {
  id: number;
  username: string;
  body: string;
  created_at: string;
  burn_at?: string | null;
  no_forward?: number;
  kind?: string;
  owner_email?: string;
  avatar_url?: string | null;
};
type Chan = { slug: string; name: string; kind: string; gate_note: string | null };

function UserTip({
  name,
  me,
  isFriend,
  alignRight,
  onAdded,
  onMessage,
}: {
  name: string;
  me?: string;
  isFriend?: boolean;
  alignRight?: boolean;
  onAdded?: () => void;
  onMessage?: (name: string) => void;
}) {
  const [card, setCard] = useState<null | {
    username: string;
    bio: string | null;
    avatar_url: string | null;
    telegram_id: string | null;
    discord_id: string | null;
    wallets: { kind: string; address: string }[];
  }>(null);
  const [on, setOn] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(!!isFriend);
  const [pos, setPos] = useState({ top: 8, left: 8 });
  const wrapRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const place = () => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const w = 256;
    const h = cardRef.current?.offsetHeight || 230;
    const composer = 180;
    const spaceBelow = window.innerHeight - r.bottom - composer;
    const above = spaceBelow < h;
    let top = above ? r.top - h - 8 : r.bottom + 8;
    top = Math.max(8, Math.min(top, window.innerHeight - h - 12));
    const preferRight = !!alignRight || r.left > window.innerWidth / 2;
    let left = preferRight ? r.right - w : r.left;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    setPos({ top, left });
  };

  const show = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    place();
    setOn(true);
  };

  const hideSoon = () => {
    if (pinned) return;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setOn(false), 320);
  };

  useEffect(() => {
    setAdded(!!isFriend);
  }, [isFriend]);

  useEffect(() => {
    if (!on || name.startsWith('0xStealth') || name === 'sdk') return;
    fetch(`/api/chat/profile?username=${encodeURIComponent(name)}`)
      .then((r) => r.json())
      .then((d) => d.ok && setCard(d.profile))
      .catch(() => {});
  }, [on, name]);

  useEffect(() => {
    if (!on) return;
    place();
    const id = requestAnimationFrame(place);
    const onWin = () => place();
    window.addEventListener('resize', onWin);
    window.addEventListener('scroll', onWin, true);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', onWin);
      window.removeEventListener('scroll', onWin, true);
    };
  }, [on, card, alignRight]);

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const add = async () => {
    setAdding(true);
    try {
      const res = await fetch('/api/chat/friends', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name }),
      });
      const d = await res.json();
      if (d.ok) {
        setAdded(true);
        onAdded?.();
      }
    } finally {
      setAdding(false);
    }
  };

  const self = !!me && name === me;

  return (
    <span
      ref={wrapRef}
      className="relative inline-block"
      onMouseEnter={show}
      onMouseLeave={hideSoon}
    >
      <button
        type="button"
        className="text-emerald-400"
        onClick={() => {
          if (on && pinned) {
            setPinned(false);
            setOn(false);
            return;
          }
          setPinned(true);
          show();
        }}
      >
        {name}
      </button>
      {on &&
        typeof document !== 'undefined' &&
        createPortal(
        <div
          ref={cardRef}
          className="fixed z-[200] w-64 rounded-2xl border border-white/15 bg-[#12141c] p-3 text-left shadow-2xl"
          style={{ top: pos.top, left: pos.left }}
          onMouseEnter={show}
          onMouseLeave={hideSoon}
        >
          {!card ? (
            <div className="text-xs opacity-50">Loading…</div>
          ) : (
            <>
              <div className="flex gap-2 items-center mb-2">
                {card.avatar_url && (
                  <img src={card.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                )}
                <div>
                  <div className="font-semibold text-sm">{card.username}</div>
                  <div className="text-[11px] opacity-50">{card.bio || 'No bio'}</div>
                </div>
              </div>
              <div className="text-[11px] opacity-70 space-y-1">
                <div>Telegram {card.telegram_id || '—'}</div>
                <div>Discord {card.discord_id || '—'}</div>
                {card.wallets.map((w) => (
                  <div key={w.address} className="font-mono break-all">
                    {w.kind}: {w.address.slice(0, 6)}…{w.address.slice(-4)}
                  </div>
                ))}
              </div>
              {!self && !name.startsWith('0xStealth') && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={adding || added}
                    onClick={add}
                    className="py-2 rounded-xl border border-white/15 text-xs font-semibold disabled:opacity-50"
                  >
                    {added ? 'Added' : adding ? 'Adding…' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPinned(false);
                      setOn(false);
                      onMessage?.(name);
                    }}
                    className="py-2 rounded-xl bg-emerald-400 text-black text-xs font-semibold"
                  >
                    Message
                  </button>
                </div>
              )}
            </>
          )}
        </div>,
        document.body
      )}
    </span>
  );
}

function NftCard({ mint }: { mint: string }) {
  const [meta, setMeta] = useState<{ name?: string; image?: string; explorer?: string }>({});
  useEffect(() => {
    fetch(`/api/chat/nft?mint=${encodeURIComponent(mint)}`)
      .then((r) => r.json())
      .then((d) => d.ok && setMeta(d));
  }, [mint]);
  return (
    <a href={meta.explorer || `https://solscan.io/token/${mint}`} target="_blank" rel="noreferrer" className="block">
      {meta.image && <img src={meta.image} alt="" className="w-40 h-40 object-cover rounded-xl mb-2" />}
      <div className="text-xs font-semibold">{meta.name || 'NFT'}</div>
      <div className="font-mono text-[10px] break-all opacity-60">{mint}</div>
    </a>
  );
}

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
  const next =
    typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/chat';
  return (
    <RequireLogin next={next}>
      <ChatInner />
    </RequireLogin>
  );
}

function ChatInner() {
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
  const [email, setEmail] = useState('');
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<{ username: string; email: string; self?: boolean }[]>([]);
  const [friends, setFriends] = useState<{ username: string; friend_email: string }[]>([]);
  const [stickers, setStickers] = useState(false);
  const [tradeOn, setTradeOn] = useState(false);
  const [sell, setSell] = useState('$MT');
  const [buy, setBuy] = useState('USDC');
  const [amt, setAmt] = useState('100');
  const [nftMint, setNftMint] = useState('');
  const [nftOn, setNftOn] = useState(false);
  const [peer, setPeer] = useState<{ username: string; email: string } | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const STICKERS = ['🚀', '💎', '🔥', '📈', '📉', '🐋', '✅', '❌', '🫡', '🧠', '🎮', '🪙'];

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
    if (String(room).startsWith('dm-')) {
      setEvents([]);
      return;
    }
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
        setEmail(d.user?.email || '');
      });
    loadChans();
    fetch('/api/chat/friends', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setFriends(d.friends || []));
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
    setPeer(null);
    loadChans();
    setRoom(data.slug);
    setOpen(true);
  };

  const del = async (id: number) => {
    await fetch(`/api/chat?id=${id}`, { method: 'DELETE', credentials: 'include' });
    load();
  };

  const openDm = async (username: string, friendEmail?: string) => {
    setErr('');
    const res = await fetch('/api/chat/dm', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email: friendEmail }),
    });
    const d = await res.json();
    if (!d.ok) {
      setErr(d.error || 'Could not open chat');
      return;
    }
    setPeer(d.with);
    setRoom(d.slug);
    setOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.set('with', d.with?.username || username);
    window.history.replaceState({}, '', url.pathname + url.search);
  };

  useEffect(() => {
    const want = new URLSearchParams(window.location.search).get('with');
    if (want) openDm(want);
    // open a 1:1 thread from ?with=username — not the public room
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFriend = async (username: string, friendEmail: string) => {
    await fetch('/api/chat/friends', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: friendEmail, username }),
    });
    const d = await fetch('/api/chat/friends', { credentials: 'include' }).then((r) => r.json());
    setFriends(d.friends || []);
    setHits([]);
    setQ('');
  };

  const sendSticker = async (s: string) => {
    await fetch('/api/chat', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, text: s, kind: 'sticker', persona }),
    });
    setStickers(false);
    load();
  };

  const sendTrade = async () => {
    const payload = `TRADE ${amt} ${sell} → ${buy}`;
    await fetch('/api/chat', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, text: payload, kind: 'trade', persona }),
    });
    setTradeOn(false);
    load();
  };

  const uploadFile = async (file: File, as: 'chat') => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/chat/media', { method: 'POST', credentials: 'include', body: fd });
    const data = await res.json();
    if (!data.ok) {
      setErr(data.error || 'Upload failed');
      return;
    }
    await fetch('/api/chat', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, text: data.url, kind: 'image', persona }),
    });
    load();
  };

  const sendNft = async () => {
    const mint = nftMint.trim();
    if (mint.length < 32) return;
    await fetch('/api/chat', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, text: mint, kind: 'nft', persona }),
    });
    setNftMint('');
    setNftOn(false);
    load();
  };

  const searchUsers = async (v: string) => {
    setQ(v);
    if (v.trim().length < 2) {
      setHits([]);
      return;
    }
    const d = await fetch(`/api/chat/users?q=${encodeURIComponent(v)}`, { credentials: 'include' }).then((r) =>
      r.json()
    );
    setHits(d.users || []);
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
          <div className="px-3 pb-2">
            <input
              value={q}
              onChange={(e) => searchUsers(e.target.value)}
              placeholder="Find people"
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-sm"
            />
            {hits.map((h) => (
              <div key={h.email} className="flex justify-between items-center gap-2 text-xs py-1">
                <span className="truncate">@{h.username}</span>
                {!h.self && (
                  <span className="flex gap-2 shrink-0">
                    <button type="button" className="text-emerald-400" onClick={() => addFriend(h.username, h.email)}>
                      Add
                    </button>
                    <button type="button" className="text-emerald-400" onClick={() => openDm(h.username, h.email)}>
                      Message
                    </button>
                  </span>
                )}
              </div>
            ))}
            <div className="mt-3 text-[10px] uppercase tracking-wider opacity-40">Friends</div>
            {!friends.length && (
              <p className="text-[11px] opacity-40 py-1">
                Hover a name, tap Add, then Message them here — that is a private chat, not the main room.
              </p>
            )}
            {friends.map((f) => (
              <div
                key={f.friend_email}
                className={`flex items-center justify-between gap-2 text-xs py-1.5 px-1 rounded-lg ${
                  peer?.email === f.friend_email ? 'bg-white/10' : ''
                }`}
              >
                <button
                  type="button"
                  className="truncate text-left text-emerald-400"
                  onClick={() => openDm(f.username || '', f.friend_email)}
                >
                  @{f.username || f.friend_email}
                </button>
                <button
                  type="button"
                  className="opacity-40 hover:opacity-100 shrink-0"
                  onClick={async () => {
                    await fetch('/api/chat/friends', {
                      method: 'DELETE',
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: f.friend_email }),
                    });
                    const d = await fetch('/api/chat/friends', { credentials: 'include' }).then((r) => r.json());
                    setFriends(d.friends || []);
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
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
                setPeer(null);
                setRoom(c.slug);
                setOpen(true);
                const url = new URL(window.location.href);
                url.searchParams.delete('with');
                window.history.replaceState({}, '', url.pathname + url.search);
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
              <div className="font-semibold truncate">
                {peer ? `@${peer.username}` : `#${current?.name || room}`}
              </div>
              <div className="text-xs opacity-50 capitalize">
                {peer ? 'Direct message' : current?.kind || 'public'}
              </div>
            </div>
            {!peer && (
              <button type="button" onClick={emit} className="text-[11px] opacity-50 hidden sm:inline">
                Post event
              </button>
            )}
          </header>
          {!!events.length && (
            <div className="px-3 py-2 border-b border-white/5 text-[11px] text-emerald-400">
              Latest event: {events[events.length - 1]?.event_name}
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
            {msgs.map((m) => (
              <div key={m.id} className={m.username === who || m.username.startsWith('0xStealth') ? 'text-right' : ''}>
                <div className="text-[11px] text-emerald-400 inline-flex items-center gap-1.5">
                  {m.avatar_url && (
                    <img src={m.avatar_url} alt="" className="w-5 h-5 rounded-md object-cover" />
                  )}
                  <UserTip
                    name={m.username}
                    me={who}
                    alignRight={m.username === who || m.username.startsWith('0xStealth')}
                    isFriend={friends.some((f) => f.username === m.username)}
                    onAdded={() => {
                      fetch('/api/chat/friends', { credentials: 'include' })
                        .then((r) => r.json())
                        .then((d) => setFriends(d.friends || []));
                    }}
                    onMessage={(n) => openDm(n)}
                  />
                  {m.no_forward ? ' · no forward' : ''}
                  {m.burn_at ? ' · burns' : ''}{' '}
                  <span className="opacity-40">{new Date(m.created_at).toLocaleTimeString()}</span>
                </div>
                <div
                  className={`inline-block text-sm text-left max-w-[85%] rounded-2xl px-3 py-2 ${
                    m.kind === 'event' || m.kind === 'trade'
                      ? 'border border-emerald-400/40'
                      : 'bg-white/5'
                  }`}
                >
                  {m.kind === 'asset' && (
                    <div className="text-[10px] uppercase tracking-wider opacity-50 mb-1">Token card</div>
                  )}
                  {m.kind === 'trade' && (
                    <div className="text-[10px] uppercase tracking-wider text-emerald-400 mb-1">Trade</div>
                  )}
                  {m.kind === 'sticker' ? (
                    <span className="text-4xl leading-none">{m.body}</span>
                  ) : m.kind === 'image' ? (
                    <img src={m.body} alt="" className="max-w-[220px] rounded-xl" />
                  ) : m.kind === 'nft' ? (
                    <NftCard mint={m.body} />
                  ) : (
                    renderBody(m.body)
                  )}
                  {email && m.owner_email === email && (
                    <button type="button" className="block text-[10px] opacity-50 mt-1" onClick={() => del(m.id)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!msgs.length && (
              <div className="text-sm opacity-40">
                {peer ? `Private chat with @${peer.username}. Only you two see this.` : 'No messages yet. Start the room.'}
              </div>
            )}
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
            {stickers && (
              <div className="flex flex-wrap gap-2 text-2xl">
                {STICKERS.map((s) => (
                  <button key={s} type="button" onClick={() => sendSticker(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {tradeOn && (
              <div className="flex flex-wrap gap-2 text-xs">
                <input value={amt} onChange={(e) => setAmt(e.target.value)} className="w-20 px-2 py-1 rounded bg-black/40 border border-white/15" />
                <input value={sell} onChange={(e) => setSell(e.target.value)} className="w-20 px-2 py-1 rounded bg-black/40 border border-white/15" />
                <span className="opacity-50 self-center">→</span>
                <input value={buy} onChange={(e) => setBuy(e.target.value)} className="w-20 px-2 py-1 rounded bg-black/40 border border-white/15" />
                <button type="button" onClick={sendTrade} className="text-emerald-400">
                  Post trade
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  authed
                    ? peer
                      ? `Message @${peer.username}`
                      : `Message #${current?.name || room}`
                    : 'Sign in to send'
                }
                disabled={!authed}
                className="flex-1 min-w-[140px] px-3 py-2.5 rounded-xl bg-black/40 border border-white/15 text-sm"
              />
              <button type="button" className="text-xs px-3 py-2 rounded-xl border border-white/15" onClick={() => setStickers((v) => !v)}>
                Stickers
              </button>
              <button type="button" className="text-xs px-3 py-2 rounded-xl border border-white/15" onClick={() => setTradeOn((v) => !v)}>
                Trade
              </button>
              <button type="button" className="text-xs px-3 py-2 rounded-xl border border-white/15" onClick={() => setNftOn((v) => !v)}>
                NFT
              </button>
              <label className="text-xs px-3 py-2 rounded-xl border border-white/15 cursor-pointer">
                Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadFile(f, 'chat');
                  }}
                />
              </label>
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
            {nftOn && (
              <div className="flex flex-wrap gap-2 text-xs">
                <input
                  value={nftMint}
                  onChange={(e) => setNftMint(e.target.value)}
                  placeholder="NFT mint address"
                  className="flex-1 min-w-[160px] px-2 py-1 rounded-xl bg-black/40 border border-white/15 font-mono"
                />
                <button type="button" onClick={sendNft} className="text-emerald-400">
                  Send NFT
                </button>
              </div>
            )}

            {err && <div className="text-sm text-red-400">{err}</div>}
          </form>
        </section>
      </div>
    </div>
  );
}
