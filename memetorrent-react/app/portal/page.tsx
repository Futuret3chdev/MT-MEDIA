'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import GameCard from '@/components/games/GameCard';
import { liveGames } from '@/lib/mt-catalog';

type Mode = 'users' | 'developers' | 'businesses';
type UserTab = 'me' | 'games' | 'scores' | 'wallet' | 'chat' | 'friends';

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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-1">Portal</div>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome, {user.username}</h1>
        </div>
        <button onClick={logout} className="text-sm opacity-60 hover:opacity-100">
          Log out
        </button>
      </div>

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
            {USER_NAV.map((n) => (
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
              <Empty title="Friends" body="Add people from this profile. Chat is the live room; friends is the list." />
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
          </div>
        </div>
      )}

      {mode === 'developers' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl p-6 border border-emerald-400/30" style={{ background: 'var(--card)' }}>
            <div className="text-xs tracking-[2px] text-emerald-400 mb-2">
              {(user.license_tier || 'free').toUpperCase()} LICENSE
            </div>
            <div className="font-mono text-lg sm:text-xl text-emerald-400 break-all mb-3">
              {user.license_key || 'Issuing…'}
            </div>
            <p className="text-sm opacity-70">
              Your builder license for Studio and game downloads.
            </p>
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
          <div className="rounded-2xl p-6 border border-white/10 sm:col-span-2" style={{ background: 'var(--card)' }}>
            <h2 className="font-semibold text-xl mb-2">Pro</h2>
            <p className="text-sm opacity-70">Publish into TAP / P2E when you are ready to ship on the ecosystem.</p>
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

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-sm opacity-70">{body}</p>
    </div>
  );
}
