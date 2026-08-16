'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import BackBar from '@/components/ui/BackBar';
import RequireLogin from '@/components/auth/RequireLogin';
import RoomStudio, { youtubeId, type RoomExtra } from '@/components/chat/RoomStudio';
import MtMiniChart from '@/components/chat/MtMiniChart';
import RoomGame, { type GameState } from '@/components/chat/RoomGame';
import CallDock, { type CallTarget } from '@/components/chat/CallDock';

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
type Chan = RoomExtra & { gate_note?: string | null };

function UserTip({
  name,
  me,
  isFriend,
  alignRight,
  onAdded,
  onMessage,
  onCall,
}: {
  name: string;
  me?: string;
  isFriend?: boolean;
  alignRight?: boolean;
  onAdded?: () => void;
  onMessage?: (name: string) => void;
  onCall?: (name: string) => void;
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
                <div className="mt-3 grid grid-cols-3 gap-2">
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
                  <button
                    type="button"
                    onClick={() => {
                      setPinned(false);
                      setOn(false);
                      onCall?.(name);
                    }}
                    className="py-2 rounded-xl border border-emerald-400/40 text-emerald-400 text-xs font-semibold"
                  >
                    Call
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
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\$[A-Za-z0-9]+|0x[a-fA-F0-9]{6,}|[1-9A-HJ-NP-Za-km-z]{32,44})/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    if (p.startsWith('`') && p.endsWith('`')) {
      return (
        <code key={i} className="font-mono text-emerald-300">
          {p.slice(1, -1)}
        </code>
      );
    }
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

function ytCmd(win: Window | null, func: string, args: unknown[] = []) {
  try {
    win?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
  } catch {
    /* ignore */
  }
}

function RoomLiveMedia({
  url,
  playing,
  started,
  canEdit,
  onToggle,
}: {
  url: string;
  playing: boolean;
  started?: string | null;
  canEdit: boolean;
  onToggle: (playing: boolean) => void;
}) {
  const [muted, setMuted] = useState(true);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const lastStart = useRef<string | null>(null);
  const yt = youtubeId(url);
  const isAudio = /\.(mp3|wav|ogg|m4a)(\?|$)/i.test(url);

  const sessionId = (at?: string | null) => {
    if (!at) return `${url}|play`;
    const t = new Date(at).getTime();
    return `${url}|${Number.isFinite(t) ? Math.floor(t / 2000) : at}`;
  };

  const onlyMute = (silence: boolean) => {
    setMuted(silence);
    const el = mediaRef.current;
    if (el) el.muted = silence;
    ytCmd(frameRef.current?.contentWindow || null, silence ? 'mute' : 'unMute');
  };

  const restartForHost = (withSound: boolean) => {
    onlyMute(!withSound);
    const el = mediaRef.current;
    if (el) {
      el.pause();
      try {
        el.currentTime = 0;
      } catch {
        /* ignore */
      }
      el.muted = !withSound;
      const p = el.play();
      try {
        el.currentTime = 0;
      } catch {
        /* ignore */
      }
      if (p) {
        p.catch(() => {
          el.muted = true;
          setMuted(true);
          try {
            el.currentTime = 0;
          } catch {
            /* ignore */
          }
          el.play().catch(() => {});
        });
      }
    }
    const win = frameRef.current?.contentWindow || null;
    ytCmd(win, 'stopVideo');
    ytCmd(win, 'seekTo', [0, true]);
    ytCmd(win, 'playVideo');
  };

  const stopLocal = () => {
    const el = mediaRef.current;
    if (el) {
      el.pause();
      try {
        el.currentTime = 0;
      } catch {
        /* ignore */
      }
    }
    ytCmd(frameRef.current?.contentWindow || null, 'pauseVideo');
    ytCmd(frameRef.current?.contentWindow || null, 'seekTo', [0, true]);
  };

  useEffect(() => {
    if (!playing) {
      lastStart.current = null;
      stopLocal();
      return;
    }
    const session = sessionId(started);
    if (lastStart.current === session) return;
    lastStart.current = session;
    restartForHost(canEdit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, started, url]);

  return (
    <div className="px-3 py-2 border-b border-white/5">
      <div className="flex items-center gap-2 mb-1">
        <div className="text-[10px] uppercase tracking-wider text-emerald-400">
          {playing ? 'Playing for everyone' : 'Stopped'}
        </div>
        {canEdit && (
          <button
            type="button"
            className="text-[11px] text-emerald-400"
            onClick={() => {
              const next = !playing;
              if (next) {
                lastStart.current = sessionId(new Date().toISOString());
                restartForHost(true);
              } else {
                lastStart.current = null;
                stopLocal();
              }
              onToggle(next);
            }}
          >
            {playing ? 'Stop' : 'Play'}
          </button>
        )}
        <button type="button" className="text-[11px] opacity-80" onClick={() => onlyMute(!muted)}>
          {muted ? 'Unmute' : 'Mute'}
        </button>
      </div>
      {yt ? (
        <iframe
          ref={frameRef}
          title="room media"
          className="w-full max-w-sm aspect-video rounded-xl pointer-events-none"
          src={`https://www.youtube.com/embed/${yt}?autoplay=1&mute=1&start=0&controls=0&disablekb=1&enablejsapi=1`}
          allow="autoplay; encrypted-media"
        />
      ) : isAudio ? (
        <audio
          ref={(el) => {
            mediaRef.current = el;
          }}
          src={url}
          playsInline
          className="w-full max-w-sm"
        />
      ) : (
        <video
          ref={(el) => {
            mediaRef.current = el;
          }}
          src={url}
          loop
          playsInline
          className="w-full max-w-sm rounded-xl"
        />
      )}
    </div>
  );
}

function GameInvite({ body, who }: { body: string; who: string }) {
  let meta: { title?: string; play?: string; id?: string } = {};
  try {
    if (body.startsWith('{')) meta = JSON.parse(body);
  } catch {
    meta = { title: body };
  }
  const title = meta.title || 'a game';
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-emerald-400 mb-1">Game invite</div>
      <div className="text-sm">
        @{who} wants to play <span className="text-emerald-400">{title}</span>
      </div>
      <div className="text-[11px] opacity-50 mt-1">It is waiting in this room. You were not moved anywhere.</div>
      {meta.play ? (
        <a
          href={meta.play}
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-2 text-xs font-semibold text-black bg-emerald-400 px-3 py-1.5 rounded-full"
        >
          Join {title}
        </a>
      ) : (
        <div className="text-xs text-emerald-400 mt-2">Sit down in the room game above.</div>
      )}
    </div>
  );
}

function FileBubble({ kind, body }: { kind?: string; body: string }) {
  let meta: { url?: string; name?: string } = {};
  try {
    if (body.startsWith('{')) meta = JSON.parse(body);
  } catch {
    meta = {};
  }
  const url = meta.url || body;
  const name = meta.name || url.split('/').pop() || 'file';
  if (kind === 'audio') {
    return (
      <div>
        <div className="text-[10px] uppercase tracking-wider opacity-50 mb-1">Music</div>
        <audio controls src={url} className="w-56 max-w-full" />
        <div className="text-[10px] opacity-50 mt-1 truncate">{name}</div>
      </div>
    );
  }
  if (kind === 'video') {
    return (
      <div>
        <div className="text-[10px] uppercase tracking-wider opacity-50 mb-1">Video</div>
        <div className="text-[11px] opacity-70">Video — playing in the room player above</div>
        <div className="text-[10px] opacity-50 mt-1 truncate">{name}</div>
      </div>
    );
  }
  if (kind === 'file') {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="text-emerald-400 text-xs break-all">
        📎 {name}
      </a>
    );
  }
  return <img src={url} alt="" className="max-w-[220px] rounded-xl" />;
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
  const [incoming, setIncoming] = useState<{ id: number; from_email: string; from_username: string }[]>([]);
  const [outgoing, setOutgoing] = useState<{ friend_email: string; username: string }[]>([]);
  const [stickers, setStickers] = useState(false);
  const [tradeOn, setTradeOn] = useState(false);
  const [sell, setSell] = useState('$MT');
  const [buy, setBuy] = useState('USDC');
  const [amt, setAmt] = useState('100');
  const [nftMint, setNftMint] = useState('');
  const [nftOn, setNftOn] = useState(false);
  const [peer, setPeer] = useState<{ username: string; email: string } | null>(null);
  const [studio, setStudio] = useState(false);
  const [extra, setExtra] = useState<RoomExtra | null>(null);
  const [callTo, setCallTo] = useState<CallTarget | null>(null);
  const [gameInvites, setGameInvites] = useState<
    { id: number; from_username: string; room: string; title: string; play: string | null }[]
  >([]);
  const [picked, setPicked] = useState<{
    username: string;
    email: string;
    friend?: boolean;
  } | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const STICKERS = ['🚀', '💎', '🔥', '📈', '📉', '🐋', '✅', '❌', '🫡', '🧠', '🎮', '🪙'];

  const listed = channels.find((c) => c.slug === room);
  const current =
    extra && extra.slug === room ? ({ ...(listed || {}), ...extra } as Chan) : listed || extra;
  const myRole =
    current?.my_role ||
    (email && current?.owner_email && current.owner_email.toLowerCase() === email.toLowerCase()
      ? 'owner'
      : 'member');
  const canEditRoom =
    current?.kind === 'vault' ||
    current?.kind === 'dm' ||
    myRole === 'owner' ||
    myRole === 'admin' ||
    myRole === 'mod';

  const loadChans = () => {
    fetch('/api/chat/channels', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        const list = (d.channels || []) as Chan[];
        setChannels(list);
        const hit = list.find((c) => c.slug === room);
        if (hit) setExtra(hit);
      });
  };

  const load = () => {
    fetch('/api/chat/friends', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setFriends(d.friends || []);
        setIncoming(d.incoming || []);
        setOutgoing(d.outgoing || []);
      })
      .catch(() => {});
    fetch('/api/chat/game', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setGameInvites(d.invites || []))
      .catch(() => {});
    fetch(`/api/chat?room=${room}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setMsgs(d.messages || []);
        if (d.channel) {
          setExtra((prev) => {
            if (
              prev &&
              prev.slug === d.channel.slug &&
              prev.music_url === d.channel.music_url &&
              !!prev.media_playing === !!d.channel.media_playing &&
              String(prev.media_started || '') === String(d.channel.media_started || '') &&
              prev.game_id === d.channel.game_id &&
              prev.game_state === d.channel.game_state
            ) {
              return prev;
            }
            return d.channel;
          });
          setChannels((list) =>
            list.some((c) => c.slug === d.channel.slug)
              ? list.map((c) => (c.slug === d.channel.slug ? { ...c, ...d.channel } : c))
              : d.channel.kind === 'dm' || d.channel.kind === 'vault'
                ? list
                : [...list, d.channel]
          );
        }
      });
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
    const pullFriends = (d: {
      friends?: { username: string; friend_email: string }[];
      incoming?: { id: number; from_email: string; from_username: string }[];
      outgoing?: { friend_email: string; username: string }[];
    }) => {
      setFriends(d.friends || []);
      setIncoming(d.incoming || []);
      setOutgoing(d.outgoing || []);
    };
    fetch('/api/chat/friends', { credentials: 'include' })
      .then((r) => r.json())
      .then(pullFriends);
    const params = new URLSearchParams(window.location.search);
    const deep = params.get('room');
    if (deep) {
      setRoom(deep);
      setOpen(true);
    }
    const join = params.get('join');
    if (join) {
      fetch('/api/chat/invite', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: join }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.ok && d.slug) {
            setRoom(d.slug);
            setOpen(true);
            loadChans();
          } else setErr(d.error || 'Invite not valid');
        });
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 1200);
    const onFriends = () => load();
    window.addEventListener('mt-friends', onFriends);
    return () => {
      clearInterval(t);
      window.removeEventListener('mt-friends', onFriends);
    };
  }, [room]);

  useEffect(() => {
    if (room.startsWith('dm-') && peer) {
      setExtra((prev) =>
        prev && prev.slug === room
          ? prev
          : { slug: room, name: peer.username, kind: 'dm' }
      );
    }
  }, [room, peer]);

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
      body: JSON.stringify({ email: friendEmail, username, action: 'request' }),
    });
    const d = await fetch('/api/chat/friends', { credentials: 'include' }).then((r) => r.json());
    setFriends(d.friends || []);
    setIncoming(d.incoming || []);
    setOutgoing(d.outgoing || []);
    setHits([]);
    setQ('');
  };

  const answerFriend = async (fromEmail: string, action: 'accept' | 'decline') => {
    const d = await fetch('/api/chat/friends', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fromEmail, action }),
    }).then((r) => r.json());
    const next = await fetch('/api/chat/friends', { credentials: 'include' }).then((r) => r.json());
    setFriends(next.friends || []);
    setIncoming(next.incoming || []);
    setOutgoing(next.outgoing || []);
    if (d.slug) {
      setRoom(d.slug);
      setOpen(true);
    }
    window.dispatchEvent(new Event('mt-friends'));
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

  const uploadFile = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/chat/media', { method: 'POST', credentials: 'include', body: fd });
    const data = await res.json();
    if (!data.ok) {
      setErr(data.error || 'Upload failed');
      return data;
    }
    const kind = data.kind || 'file';
    const payload = JSON.stringify({ url: data.url, name: data.name || file.name });
    await fetch('/api/chat', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, text: payload, kind, persona }),
    });
    const role = extra?.my_role;
    const hostish = extra?.kind === 'vault' || extra?.kind === 'dm' || role === 'owner' || role === 'admin' || role === 'mod';
    if ((kind === 'video' || kind === 'audio') && hostish) {
      await fetch('/api/chat/channels', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: room, music_url: data.url, media_playing: true }),
      });
      setExtra((e) =>
        e ? { ...e, music_url: data.url, media_playing: true, media_started: new Date().toISOString() } : e
      );
    }
    load();
    return data;
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
              <button
                key={h.email}
                type="button"
                className="block w-full text-left text-xs py-1.5 truncate text-emerald-400"
                onClick={() =>
                  setPicked({
                    username: h.username,
                    email: h.email,
                    friend: friends.some((f) => f.friend_email === h.email),
                  })
                }
              >
                @{h.username}
              </button>
            ))}
            <div className="mt-3 text-[10px] uppercase tracking-wider opacity-40">Settings</div>
            {channels
              .filter((c) => c.kind === 'vault')
              .map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => {
                    setPeer(null);
                    setRoom(c.slug);
                    setExtra(c);
                    setOpen(true);
                  }}
                  className={`w-full text-left px-1 py-1.5 text-xs rounded-lg ${
                    room === c.slug ? 'bg-emerald-400/15 text-emerald-400' : 'opacity-80'
                  }`}
                >
                  Vault
                </button>
              ))}
            <div className="mt-2 text-[10px] uppercase tracking-wider opacity-40">Friends</div>
            {!friends.length && (
              <p className="text-[11px] opacity-40 py-1">
                Hover a name, tap Add, then Message them here — that is a private chat, not the main room.
              </p>
            )}
            {friends.map((f) => (
              <button
                key={f.friend_email}
                type="button"
                className={`block w-full text-left text-xs py-1.5 px-1 rounded-lg truncate ${
                  picked?.email === f.friend_email || peer?.email === f.friend_email
                    ? 'bg-white/10 text-emerald-400'
                    : 'text-emerald-400'
                }`}
                onClick={() =>
                  setPicked({ username: f.username || f.friend_email, email: f.friend_email, friend: true })
                }
              >
                @{f.username || f.friend_email}
              </button>
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
                <option value="private">Private (invite)</option>
              </select>
              <button className="w-full py-2 rounded-xl bg-emerald-400 text-black text-sm font-semibold">
                Create
              </button>
            </form>
          )}
          {channels
            .filter((c) => c.kind !== 'vault')
            .sort((a, b) => {
              const sys = ['trades', 'signals', 'otc', 'general', 'support'];
              const au = sys.includes(a.slug) ? 1 : 0;
              const bu = sys.includes(b.slug) ? 1 : 0;
              return au - bu;
            })
            .map((c) => (
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

        <section
          className={`${open ? 'flex' : 'hidden'} md:flex flex-col min-h-[72vh]`}
          style={
            current?.background
              ? current.background.startsWith('/') || current.background.startsWith('http')
                ? {
                    backgroundImage: `url(${current.background})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : { background: current.background }
              : undefined
          }
        >
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
            {peer && (
              <button
                type="button"
                className="text-[11px] text-emerald-400"
                onClick={() => setCallTo({ username: peer.username, email: peer.email, n: Date.now() })}
              >
                Call
              </button>
            )}
            <button type="button" className="text-[11px] text-emerald-400" onClick={() => setStudio((v) => !v)}>
              {studio ? 'Close settings' : 'Settings'}
            </button>
            {!peer && (
              <button type="button" onClick={emit} className="text-[11px] opacity-50 hidden sm:inline">
                Post event
              </button>
            )}
          </header>
          {incoming.map((req) => (
            <div
              key={`fr-${req.id}`}
              className="px-3 py-2 border-b border-emerald-400/30 bg-emerald-400/10 flex flex-wrap items-center gap-2 text-xs"
            >
              <span className="flex-1">@{req.from_username || req.from_email} sent a friend request</span>
              <button type="button" className="text-emerald-400 font-semibold" onClick={() => answerFriend(req.from_email, 'accept')}>
                Accept
              </button>
              <button type="button" className="opacity-50" onClick={() => answerFriend(req.from_email, 'decline')}>
                Decline
              </button>
            </div>
          ))}
          {gameInvites.map((inv) => (
            <div
              key={inv.id}
              className="px-3 py-2 border-b border-emerald-400/30 bg-emerald-400/10 flex flex-wrap items-center gap-2 text-xs"
            >
              <span className="flex-1">
                @{inv.from_username} wants to play <span className="text-emerald-400">{inv.title}</span>
              </span>
              <button
                type="button"
                className="text-emerald-400 font-semibold"
                onClick={() => {
                  setRoom(inv.room);
                  setPeer({ username: inv.from_username, email: '' });
                  setOpen(true);
                  fetch('/api/chat/game', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'seen', id: inv.id }),
                  });
                  setGameInvites((list) => list.filter((x) => x.id !== inv.id));
                }}
              >
                Open
              </button>
              {inv.play && (
                <a href={inv.play} target="_blank" rel="noreferrer" className="text-emerald-400">
                  Join
                </a>
              )}
              <button
                type="button"
                className="opacity-50"
                onClick={() => {
                  fetch('/api/chat/game', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'seen', id: inv.id }),
                  });
                  setGameInvites((list) => list.filter((x) => x.id !== inv.id));
                }}
              >
                Dismiss
              </button>
            </div>
          ))}
          {studio && current && (
            <RoomStudio
              room={room}
              extra={current}
              isOwner={myRole === 'owner'}
              canEdit={canEditRoom}
              vaultSlug={channels.find((c) => c.kind === 'vault')?.slug}
              onClose={() => setStudio(false)}
              onSaved={(c) => {
                setExtra(c);
                setChannels((list) => list.map((x) => (x.slug === c.slug ? { ...x, ...c } : x)));
              }}
              onCancelled={() => {
                setStudio(false);
                setPeer(null);
                setRoom('trades');
                loadChans();
              }}
            />
          )}
          {current?.topic && (
            <div className="px-3 py-2 border-b border-white/5 text-xs opacity-70">{current.topic}</div>
          )}
          <RoomGame
            room={room}
            gameId={current?.game_id}
            state={(() => {
              try {
                return current?.game_state ? (JSON.parse(current.game_state) as GameState) : null;
              } catch {
                return null;
              }
            })()}
            me={email}
            canEdit={canEditRoom || !current?.owner_email || !!picked || !!peer}
            inviteTo={picked || peer}
            onOpened={(slug, withUser) => {
              setRoom(slug);
              if (withUser) setPeer({ username: withUser.username, email: withUser.email });
              setPicked(null);
              setOpen(true);
            }}
            onChange={(game_id, state) => {
              setExtra((e) =>
                e ? { ...e, game_id, game_state: state ? JSON.stringify(state) : null } : e
              );
              load();
            }}
          />
          {current?.music_url && (
            <RoomLiveMedia
              url={current.music_url}
              playing={!!current.media_playing}
              started={current.media_started}
              canEdit={canEditRoom}
              onToggle={async (playing) => {
                const startedAt = playing ? new Date().toISOString() : current.media_started;
                await fetch('/api/chat/channels', {
                  method: 'PATCH',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ slug: room, media_playing: playing }),
                });
                setExtra((e) => (e ? { ...e, media_playing: playing, media_started: startedAt } : e));
              }}
            />
          )}
          {current?.show_chart && (
            <div className="px-3 py-2 border-b border-white/5">
              <MtMiniChart />
            </div>
          )}
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
                    onCall={(n) => setCallTo({ username: n, n: Date.now() })}
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
                  ) : m.kind === 'image' || m.kind === 'audio' || m.kind === 'video' || m.kind === 'file' ? (
                    <FileBubble kind={m.kind} body={m.body} />
                  ) : m.kind === 'nft' ? (
                    <NftCard mint={m.body} />
                  ) : m.kind === 'game' ? (
                    <GameInvite body={m.body} who={m.username} />
                  ) : m.kind === 'friend' ? (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-emerald-400 mb-1">Friend request</div>
                      <div className="text-sm">{m.body}</div>
                    </div>
                  ) : (
                    renderBody(m.body)
                  )}
                  {email && m.owner_email === email && (
                    <span className="flex gap-2 mt-1">
                      <button type="button" className="text-[10px] opacity-50" onClick={() => del(m.id)}>
                        Delete
                      </button>
                      {current?.kind !== 'vault' &&
                        (m.kind === 'image' || m.kind === 'audio' || m.kind === 'video' || m.kind === 'file') && (
                          <button
                            type="button"
                            className="text-[10px] text-emerald-400"
                            onClick={async () => {
                              let meta: { url?: string; name?: string } = {};
                              try {
                                if (m.body.startsWith('{')) meta = JSON.parse(m.body);
                              } catch {
                                meta = {};
                              }
                              await fetch('/api/chat/vault', {
                                method: 'POST',
                                credentials: 'include',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  url: meta.url || m.body,
                                  name: meta.name,
                                  kind: m.kind,
                                }),
                              });
                            }}
                          >
                            Save to vault
                          </button>
                        )}
                    </span>
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
                    if (f) uploadFile(f);
                    e.target.value = '';
                  }}
                />
              </label>
              <label className="text-xs px-3 py-2 rounded-xl border border-white/15 cursor-pointer">
                Music
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadFile(f);
                    e.target.value = '';
                  }}
                />
              </label>
              <label className="text-xs px-3 py-2 rounded-xl border border-white/15 cursor-pointer">
                Video
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadFile(f);
                    e.target.value = '';
                  }}
                />
              </label>
              <label className="text-xs px-3 py-2 rounded-xl border border-white/15 cursor-pointer">
                File
                <input
                  type="file"
                  accept=".pdf,.zip,.txt,.json,application/pdf,application/zip,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadFile(f);
                    e.target.value = '';
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
      {email && <CallDock me={email} room={room} start={callTo} />}
      {picked && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#12141c] p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider opacity-40">Selected</div>
                <div className="font-semibold">@{picked.username}</div>
              </div>
              <button type="button" className="text-xs opacity-60" onClick={() => setPicked(null)}>
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="py-2 rounded-xl bg-emerald-400 text-black text-sm font-semibold"
                onClick={() => {
                  openDm(picked.username, picked.email);
                  setPicked(null);
                }}
              >
                Message
              </button>
              <button
                type="button"
                className="py-2 rounded-xl border border-emerald-400/40 text-emerald-400 text-sm font-semibold"
                onClick={() => {
                  setCallTo({ username: picked.username, email: picked.email, n: Date.now() });
                  setPicked(null);
                }}
              >
                Call
              </button>
            </div>
            <p className="text-[11px] opacity-50">
              Play a game from the room strip while they are selected — they get an invite even if you are not friends.
            </p>
            {picked.friend ? (
              <button
                type="button"
                className="w-full py-2 text-xs opacity-50"
                onClick={async () => {
                  await fetch('/api/chat/friends', {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: picked.email }),
                  });
                  const d = await fetch('/api/chat/friends', { credentials: 'include' }).then((r) => r.json());
                  setFriends(d.friends || []);
                  setPicked(null);
                }}
              >
                Remove friend
              </button>
            ) : (
              <button
                type="button"
                className="w-full py-2 text-xs text-emerald-400"
                onClick={async () => {
                  await addFriend(picked.username, picked.email);
                  setPicked((p) => (p ? { ...p, friend: true } : p));
                }}
              >
                {outgoing.some((o) => o.friend_email === picked.email) ? 'Request sent' : 'Add friend'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
