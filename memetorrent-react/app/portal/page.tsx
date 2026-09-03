'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import GameCard from '@/components/games/GameCard';
import { liveGames } from '@/lib/mt-catalog';

type Mode = 'users' | 'developers' | 'businesses';
type UserTab = 'me' | 'games' | 'scores' | 'wallet' | 'chat' | 'friends' | 'vault';

type User = {
  username: string;
  email: string;
  wallet_address: string | null;
  license_key: string | null;
  license_tier: string;
  bio: string | null;
  avatar_url: string | null;
  telegram_id: string | null;
  telegram_username?: string | null;
  discord_id: string | null;
};

const USER_NAV: { id: UserTab; label: string }[] = [
  { id: 'me', label: 'Profile' },
  { id: 'games', label: 'Library' },
  { id: 'scores', label: 'Scores' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'chat', label: 'Chat' },
  { id: 'friends', label: 'Friends' },
  { id: 'vault', label: 'Vault' },
];

export default function PortalPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('users');
  const [tab, setTab] = useState<UserTab>('me');
  const [bio, setBio] = useState('');
  const [wallet, setWallet] = useState('');
  const [avatar, setAvatar] = useState('');
  const [saved, setSaved] = useState('');
  const [scores, setScores] = useState<{ game_id: string; score: number; created_at: string }[]>([]);
  const [wallets, setWallets] = useState<{ id: number; kind: string; address: string; is_primary: number }[]>([]);
  const [newKind, setNewKind] = useState('phantom');
  const [newAddr, setNewAddr] = useState('');
  const [walletMsg, setWalletMsg] = useState('');
  const [friends, setFriends] = useState<
    { username: string | null; friend_email: string; avatar_url?: string | null }[]
  >([]);
  const [incomingFriends, setIncomingFriends] = useState<
    { id: number; from_email: string; from_username: string }[]
  >([]);
  const [friendQ, setFriendQ] = useState('');
  const [friendHits, setFriendHits] = useState<{ username: string; email: string; self?: boolean }[]>([]);
  const [friendMsg, setFriendMsg] = useState('');


  useEffect(() => {
    const stored = localStorage.getItem('mt_portal_mode');
    if (stored === 'users' || stored === 'developers' || stored === 'businesses') setMode(stored);
    fetch('/api/portal/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          setBio(d.user.bio || '');
          setWallet(d.user.wallet_address || '');
          setAvatar(d.user.avatar_url || '');
          fetch('/api/scores?mine=1', { credentials: 'include' })
            .then((r) => r.json())
            .then((s) => setScores(s.scores || []))
            .catch(() => {});
          fetch('/api/chat/friends', { credentials: 'include' })
            .then((r) => r.json())
            .then((f) => {
              setFriends(f.friends || []);
              setIncomingFriends(f.incoming || []);
            })
            .catch(() => {});
          fetch('/api/portal/wallets', { credentials: 'include' })
            .then((r) => r.json())
            .then((w) => {
              setWallets(w.wallets || []);
              setUser((u) =>
                u
                  ? {
                      ...u,
                      telegram_id: w.telegram_id || u.telegram_id,
                      telegram_username: w.telegram_username || u.telegram_username,
                      discord_id: w.discord_id || u.discord_id,
                    }
                  : u
              );
            })
            .catch(() => {});
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const switchMode = (next: Mode) => {
    setMode(next);
    localStorage.setItem('mt_portal_mode', next);
  };

  const logout = async () => {
    await fetch('/api/portal/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/';
  };

  const saveProfile = async () => {
    setSaved('');
    const res = await fetch('/api/portal/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ bio, wallet_address: wallet, avatar_url: avatar }),
    });
    const data = await res.json();
    if (data.ok) {
      setUser(data.user);
      setSaved('Saved');
    } else setSaved(data.error || 'Could not save');
  };

  const refreshFriends = async () => {
    const d = await fetch('/api/chat/friends', { credentials: 'include' }).then((r) => r.json());
    setFriends(d.friends || []);
    setIncomingFriends(d.incoming || []);
  };

  const searchFriends = async (v: string) => {
    setFriendQ(v);
    if (v.trim().length < 2) {
      setFriendHits([]);
      return;
    }
    const d = await fetch(`/api/chat/users?q=${encodeURIComponent(v)}`, { credentials: 'include' }).then((r) =>
      r.json()
    );
    setFriendHits(d.users || []);
  };

  const addPortalFriend = async (username: string, email: string) => {
    setFriendMsg('');
    const res = await fetch('/api/chat/friends', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, action: 'request' }),
    });
    const d = await res.json();
    if (!d.ok) {
      setFriendMsg(d.error || 'Could not add');
      return;
    }
    setFriendHits([]);
    setFriendQ('');
    setFriendMsg(`Request sent to ${username}`);
    await refreshFriends();
  };

  const removeFriend = async (friend_email: string) => {
    await fetch('/api/chat/friends', {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: friend_email }),
    });
    await refreshFriends();
  };



  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-20 opacity-60">Loading portal…</div>;
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20">
        <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-2">Portal</div>
        <h1 className="text-4xl font-semibold tracking-tight mb-4">Sign in to enter the portal</h1>
        <p className="opacity-70 mb-4">
          Normal users, developers and businesses use the same login. After you are in, switch
          mode at the top.
        </p>
        <p className="text-sm opacity-60">Use the account icon in the top bar.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex flex-wrap gap-4 text-sm mb-4">
        <Link href="/" className="opacity-70 hover:opacity-100">← Home</Link>
        <Link href="/catalog" className="opacity-70 hover:opacity-100">← Games</Link>
        <Link href="/chat" className="opacity-70 hover:opacity-100">← Chat</Link>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-1">Portal</div>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome, {user.username}</h1>
        </div>
        <button onClick={logout} className="text-sm opacity-60 hover:opacity-100">
          Log out
        </button>
      </div>

      <section className="mb-8">
        <div className="uppercase text-[10px] tracking-[3px] opacity-50 mb-3">Apps</div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {[
            { href: 'https://mt.futuret3ch.com.au/', label: 'Wallet', icon: '👛', external: true },
            { href: '/catalog', label: 'Games', icon: '🎮' },
            { href: '/portal/tap', label: 'TAP', icon: '▶' },
            { href: '/portal/tapshop', label: 'TAPSHOP', icon: '🛒' },
            { href: '/portal/tapmatch', label: 'TAPMATCH', icon: '🤝' },
            { href: '/chat', label: 'Chat', icon: '💬' },
            { href: '/shield', label: 'Shield', icon: '🛡' },
          ].map((app) => (
            <Link
              key={app.label}
              href={app.href}
              target={app.external ? '_blank' : undefined}
              rel={app.external ? 'noopener' : undefined}
              className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-4 hover:border-emerald-400/50 hover:bg-white/[0.06]"
            >
              <span className="text-2xl leading-none">{app.icon}</span>
              <span className="text-[11px] font-semibold tracking-wide text-center">{app.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-2 mb-8 p-1 rounded-full border border-white/10 w-fit">
        {(['users', 'developers', 'businesses'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`px-4 py-1.5 rounded-full text-sm capitalize ${
              mode === m ? 'bg-emerald-400 text-black font-semibold' : 'opacity-70 hover:opacity-100'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === 'users' && (
        <div className="grid lg:grid-cols-[220px_1fr] gap-6">
          <nav className="flex lg:flex-col flex-wrap gap-1">
            {USER_NAV.filter((n) => !['chat', 'friends', 'vault'].includes(n.id)).map((n) => (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className={`text-left px-3 py-2 rounded-xl text-sm ${
                  tab === n.id ? 'bg-white/10 text-emerald-400' : 'opacity-70 hover:opacity-100'
                }`}
              >
                {n.label}
              </button>
            ))}
            <div className="w-full text-[10px] uppercase tracking-wider opacity-40 px-3 pt-3 pb-1">Settings</div>
            {USER_NAV.filter((n) => ['chat', 'friends', 'vault'].includes(n.id)).map((n) => (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className={`text-left px-3 py-2 rounded-xl text-sm ${
                  tab === n.id ? 'bg-white/10 text-emerald-400' : 'opacity-70 hover:opacity-100'
                }`}
              >
                {n.label}
              </button>
            ))}
          </nav>

          <div className="rounded-2xl border border-white/10 p-5 sm:p-6" style={{ background: 'var(--card)' }}>
            {tab === 'me' && (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold">My Portal</h2>
                <div className="flex items-center gap-4">
                  <img
                    src={user.avatar_url || '/games/default-avatar.png'}
                    alt=""
                    className="w-16 h-16 rounded-2xl border border-white/10 object-cover"
                  />
                  <div>
                    <div className="font-semibold">@{user.username}</div>
                    <div className="text-sm opacity-60">{user.email}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-sm items-center">
                  <input
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="Picture URL"
                    className="flex-1 min-w-[160px] px-3 py-2 rounded-xl bg-black/40 border border-white/15"
                  />
                  <label className="px-3 py-2 rounded-xl border border-white/15 cursor-pointer">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const fd = new FormData();
                        fd.append('file', f);
                        const res = await fetch('/api/chat/media', { method: 'POST', credentials: 'include', body: fd });
                        const d = await res.json();
                        if (!d.ok) {
                          setSaved(d.error || 'Upload failed');
                          return;
                        }
                        setAvatar(d.url);
                        const p = await fetch('/api/portal/profile', {
                          method: 'POST',
                          credentials: 'include',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ avatar_url: d.url, bio, wallet_address: wallet }),
                        }).then((r) => r.json());
                        if (p.user) setUser(p.user);
                        setSaved('Picture saved');
                      }}
                    />
                  </label>
                </div>
                <label className="block text-sm">
                  <span className="opacity-60">About</span>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="mt-1 w-full min-h-[90px] px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-sm"
                  />
                </label>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-white/10 p-3">
                    Discord {user.discord_id || '—'}
                  </div>
                  <div className="rounded-xl border border-white/10 p-3">
                    Telegram {user.telegram_username ? `@${user.telegram_username}` : user.telegram_id || '—'}
                  </div>
                </div>
                <p className="text-xs opacity-50">Manage linked wallets on the Wallet tab.</p>
                <button
                  onClick={saveProfile}
                  className="font-semibold text-black bg-emerald-400 px-4 py-2 rounded-full text-sm"
                >
                  Save profile
                </button>
                {saved && <span className="ml-3 text-sm opacity-60">{saved}</span>}
              </div>
            )}

            {tab === 'games' && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Library</h2>
                <p className="text-sm opacity-60 mb-4">
                  Steam-style shelf — same titles as <Link href="/p2e" className="text-emerald-400">P2E</Link> and{' '}
                  <Link href="/casino" className="text-emerald-400">Casino</Link>.
                </p>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {liveGames().map((g) => (
                    <GameCard key={g.id} game={g} />
                  ))}
                </div>
              </div>
            )}

            {tab === 'scores' && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Scores</h2>
                <p className="text-sm opacity-60 mb-4">
                  Logged-in scores from Tap Tap, Pocket and Puck land here.{' '}
                  <a href="/games/unix/tap/index.html" className="text-emerald-400">Play Tap</a>.
                </p>
                {!scores.length && <p className="text-sm opacity-50">No scores on this account yet.</p>}
                <ul className="space-y-2 text-sm">
                  {scores.map((s, i) => (
                    <li key={i} className="flex justify-between border-b border-white/10 py-2">
                      <span className="uppercase text-emerald-400">{s.game_id}</span>
                      <span className="font-mono">{s.score}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === 'wallet' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Wallets</h2>
                <p className="text-sm opacity-70">
                  Link Phantom, Infinite Wallet, or another address to this account. Telegram and Discord stay on the profile.
                </p>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-white/10 p-3">
                    Telegram {user.telegram_username ? `@${user.telegram_username}` : user.telegram_id || '—'}
                  </div>
                  <div className="rounded-xl border border-white/10 p-3">Discord {user.discord_id || '—'}</div>
                </div>
                {!wallets.length && (
                  <p className="text-sm opacity-50">No wallets linked yet. Add Phantom or a Solana address below.</p>
                )}
                <ul className="space-y-2">
                  {wallets.map((w) => (
                    <li key={w.id} className="rounded-xl border border-white/10 p-3 flex flex-wrap justify-between gap-2 text-sm">
                      <div>
                        <div className="uppercase text-[11px] text-emerald-400">
                          {w.kind}
                          {w.is_primary ? ' · primary' : ''}
                        </div>
                        <div className="font-mono break-all">{w.address}</div>
                      </div>
                      <button
                        className="opacity-60 hover:opacity-100 text-xs"
                        onClick={async () => {
                          const res = await fetch('/api/portal/wallets', {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ remove_id: w.id }),
                          });
                          const d = await res.json();
                          if (d.wallets) setWallets(d.wallets);
                        }}
                      >
                        Unlink
                      </button>
                    </li>
                  ))}
                </ul>
                <form
                  className="space-y-2 max-w-xl"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setWalletMsg('');
                    const res = await fetch('/api/portal/wallets', {
                      method: 'POST',
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        kind: newKind,
                        address: newAddr,
                        primary: wallets.length === 0,
                      }),
                    });
                    const d = await res.json();
                    if (!d.ok) {
                      setWalletMsg(d.error || 'Could not link');
                      return;
                    }
                    setWallets(d.wallets || []);
                    setNewAddr('');
                    setWalletMsg('Linked.');
                  }}
                >
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={newKind}
                      onChange={(e) => setNewKind(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-sm"
                    >
                      <option value="phantom">Phantom</option>
                      <option value="infinite">Infinite Wallet</option>
                      <option value="solana">Other Solana</option>
                      <option value="other">Other</option>
                    </select>
                    <input
                      required
                      value={newAddr}
                      onChange={(e) => setNewAddr(e.target.value)}
                      placeholder="Wallet address"
                      className="flex-1 min-w-[200px] px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-sm font-mono"
                    />
                  </div>
                  <button className="font-semibold text-black bg-emerald-400 px-4 py-2 rounded-full text-sm">
                    Link wallet
                  </button>
                  {walletMsg && <div className="text-sm opacity-70">{walletMsg}</div>}
                </form>
                <a href="https://mt.futuret3ch.com.au/" target="_blank" rel="noopener noreferrer" className="inline-block text-emerald-400 text-sm">
                  Open Infinite Wallet →
                </a>
              </div>
            )}

            {tab === 'friends' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Friends</h2>
                <p className="text-sm opacity-70">
                  They get a request and a chat message. They must Accept — adding them does not skip that.
                </p>
                {incomingFriends.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between max-w-md rounded-xl border border-emerald-400/30 p-3 text-sm"
                  >
                    <span>@{req.from_username || req.from_email} wants to be friends</span>
                    <span className="flex gap-3 text-xs">
                      <button
                        type="button"
                        className="text-emerald-400"
                        onClick={async () => {
                          await fetch('/api/chat/friends', {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: req.from_email, action: 'accept' }),
                          });
                          await refreshFriends();
                        }}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="opacity-50"
                        onClick={async () => {
                          await fetch('/api/chat/friends', {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: req.from_email, action: 'decline' }),
                          });
                          await refreshFriends();
                        }}
                      >
                        Decline
                      </button>
                    </span>
                  </div>
                ))}
                <input
                  value={friendQ}
                  onChange={(e) => searchFriends(e.target.value)}
                  placeholder="Find people by username"
                  className="w-full max-w-md px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-sm"
                />
                {friendHits.map((h) => (
                  <div key={h.email} className="flex items-center justify-between max-w-md text-sm py-1">
                    <span>@{h.username}</span>
                    {!h.self && (
                      <button
                        type="button"
                        className="text-emerald-400"
                        onClick={() => addPortalFriend(h.username, h.email)}
                      >
                        Add
                      </button>
                    )}
                  </div>
                ))}
                {friendMsg && <div className="text-sm text-emerald-400">{friendMsg}</div>}
                {!friends.length ? (
                  <p className="text-sm opacity-50">
                    No friends yet. Add someone here or hover a name in chat and tap Add.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {friends.map((f) => (
                      <li
                        key={f.friend_email}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 p-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={f.avatar_url || '/games/default-avatar.png'}
                            alt=""
                            className="w-9 h-9 rounded-xl object-cover"
                          />
                          <div className="min-w-0">
                            <div className="font-medium truncate">@{f.username || f.friend_email}</div>
                            <div className="text-[11px] opacity-50 truncate">{f.friend_email}</div>
                          </div>
                        </div>
                        <div className="flex gap-3 text-xs shrink-0">
                          <Link
                            href={`/chat?with=${encodeURIComponent(f.username || '')}`}
                            className="text-emerald-400"
                          >
                            Chat
                          </Link>
                          <button type="button" className="opacity-60" onClick={() => removeFriend(f.friend_email)}>
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {tab === 'chat' && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Crypto chat</h2>
                <p className="text-sm opacity-70 mb-3">Trades, general and support. Same login as this portal.</p>
                <Link href="/chat" className="text-emerald-400 text-sm">
                  Open chat →
                </Link>
              </div>
            )}
            {tab === 'vault' && <PortalVault />}
          </div>
        </div>
      )}

      {mode === 'developers' && (
        <div className="space-y-4">
          <div className="rounded-2xl p-6 border border-emerald-400/30" style={{ background: 'var(--card)' }}>
            <div className="text-xs tracking-[2px] text-emerald-400 mb-2">
              {(user.license_tier || 'free').toUpperCase()} LICENSE
            </div>
            <div className="font-mono text-lg sm:text-xl text-emerald-400 break-all mb-3">
              {user.license_key || 'Issuing…'}
            </div>
            <p className="text-sm opacity-70">
              This key lives on your account. Use it for Studio and the Android client. Same login on every MT site.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl p-6 border border-white/10" style={{ background: 'var(--card)' }}>
              <div className="text-xs tracking-[2px] opacity-50 mb-1">FREE</div>
              <h2 className="font-semibold text-xl mb-2">Builder</h2>
              <ul className="text-sm opacity-70 space-y-1 mb-4">
                <li>• Issued on first sign-in</li>
                <li>• Android MT Games download</li>
                <li>• Studio demo and editor</li>
              </ul>
              {(user.license_tier || 'free') === 'free' && (
                <div className="text-xs text-emerald-400">You are on Free</div>
              )}
            </div>
            <div className="rounded-2xl p-6 border border-emerald-400/30" style={{ background: 'var(--card)' }}>
              <div className="text-xs tracking-[2px] text-emerald-400 mb-1">PRO</div>
              <h2 className="font-semibold text-xl mb-2">Ecosystem</h2>
              <ul className="text-sm opacity-70 space-y-1 mb-4">
                <li>• Publish into TAP / P2E / catalog</li>
                <li>• $MT and Rockets hooks</li>
                <li>• Desktop / iOS clients when they ship</li>
              </ul>
              {(user.license_tier || 'free') === 'pro' ? (
                <div className="text-sm text-emerald-400">You are on Pro</div>
              ) : (
                <div>
                  <button
                    type="button"
                    disabled
                    className="font-semibold text-black bg-emerald-400/40 px-4 py-2 rounded-full text-sm cursor-not-allowed"
                  >
                    Upgrade to Pro
                  </button>
                  <p className="text-xs opacity-50 mt-2">Coming soon — paid upgrade. You stay on Free until then.</p>
                </div>
              )}
            </div>
          </div>
          <div className="rounded-2xl p-6 border border-white/10" style={{ background: 'var(--card)' }}>
            <h2 className="font-semibold text-xl mb-2">Downloads</h2>
            <p className="text-sm opacity-70 mb-4">Android APK for builders. iOS / Windows / Mac later.</p>
            <Link
              href="/software/games"
              className="inline-block font-semibold text-black bg-emerald-400 px-4 py-2 rounded-full text-sm"
            >
              Get Android APK
            </Link>
          </div>
        </div>
      )}

      {mode === 'businesses' && (
        <div className="rounded-2xl p-6 border border-white/10 max-w-2xl" style={{ background: 'var(--card)' }}>
          <h2 className="text-xl font-semibold mb-2">Business portal</h2>
          <p className="text-sm opacity-70 mb-4">
            For shops, partners and studios — listings, $MT checkout and staff seats.
          </p>
          <a href="/contact" className="text-emerald-400 text-sm">
            Talk to us →
          </a>
        </div>
      )}
    </div>
  );
}

function PortalVault() {
  const [slug, setSlug] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<{ id: number; kind: string; body: string; created_at: string }[]>([]);
  const [msg, setMsg] = useState('');

  const load = () => {
    fetch('/api/chat/vault', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) return;
        setSlug(d.slug || '');
        setNote(d.channel?.collab_note || '');
        setItems(d.items || []);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const saveNote = async () => {
    await fetch('/api/chat/vault', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    });
    setMsg('Vault note saved');
  };

  const upload = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const up = await fetch('/api/chat/media', { method: 'POST', credentials: 'include', body: fd }).then((r) =>
      r.json()
    );
    if (!up.ok) {
      setMsg(up.error || 'Upload failed');
      return;
    }
    await fetch('/api/chat/vault', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: up.url, name: up.name, kind: up.kind }),
    });
    setMsg('Stored in vault');
    load();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Personal vault</h2>
      <p className="text-sm opacity-70">
        Only you can see this locker. Notes, files, music and video stay on this account.
      </p>
      <label className="block text-sm">
        <span className="opacity-60">Private notes</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 w-full min-h-[100px] px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-sm"
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={saveNote}
          className="font-semibold text-black bg-emerald-400 px-4 py-2 rounded-full text-sm"
        >
          Save notes
        </button>
        <label className="px-4 py-2 rounded-full border border-white/15 text-sm cursor-pointer">
          Add file
          <input
            type="file"
            accept="image/*,audio/*,video/*,.pdf,.zip,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = '';
            }}
          />
        </label>
        {slug && (
          <Link href={`/chat?room=${slug}`} className="text-emerald-400 text-sm self-center">
            Open vault in chat →
          </Link>
        )}
      </div>
      {msg && <div className="text-sm opacity-70">{msg}</div>}
      {!items.length ? (
        <p className="text-sm opacity-50">Nothing stored yet. Add a file or save a note.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map((it) => {
            let name = it.kind;
            try {
              if (it.body.startsWith('{')) name = JSON.parse(it.body).name || it.kind;
            } catch {
              /* raw */
            }
            return (
              <li key={it.id} className="flex justify-between gap-3 border-b border-white/10 py-2">
                <span className="uppercase text-[11px] text-emerald-400">{it.kind}</span>
                <span className="truncate">{name}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
