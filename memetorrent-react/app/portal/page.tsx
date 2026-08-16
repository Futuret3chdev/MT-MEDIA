'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Mode = 'users' | 'developers' | 'businesses';
type UserTab =
  | 'me'
  | 'messages'
  | 'friends'
  | 'chat'
  | 'wallet'
  | 'avatar'
  | 'games'
  | 'nft'
  | 'leaderboard'
  | 'intel'
  | 'skins';

type User = {
  username: string;
  email: string;
  wallet_address: string | null;
  license_key: string | null;
  license_tier: string;
  bio: string | null;
  avatar_url: string | null;
  telegram_id: string | null;
  discord_id: string | null;
};

const GAMES = [
  { name: 'Tetris', href: '/games/2', img: '/games/tetris.jpg', tag: 'Beta' },
  { name: 'Pac-Man', href: '/games/unix/1/', img: '/games/unix/1/shots/level-1.png', tag: 'Live' },
  { name: 'Tap Tap', href: '/games/unix/tap/', img: '/games/taptap.jpg', tag: 'Live' },
  { name: 'Fruit Ninja', href: '/games/unix/fruitninja/', img: '/games/fruitninja.jpg', tag: 'Live' },
  { name: 'Dash', href: '/games/unix/dash/', img: '/games/dash.jpg', tag: 'Live' },
  { name: 'Chicken', href: '/games/unix/chicken/', img: '/games/chicken.jpg', tag: 'Live' },
  { name: 'Racer', href: '/games/racer/', img: '/games/racer.jpg', tag: 'Live' },
  { name: 'Android client', href: '/software/games', img: '/games/sub.png', tag: 'Dev' },
];

const USER_NAV: { id: UserTab; label: string }[] = [
  { id: 'me', label: 'My Portal' },
  { id: 'games', label: 'Gameverse' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'messages', label: 'Messages' },
  { id: 'friends', label: 'Friends' },
  { id: 'chat', label: 'Live Chat' },
  { id: 'avatar', label: 'Avatar' },
  { id: 'nft', label: 'NFTs' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'intel', label: 'Intel' },
  { id: 'skins', label: 'Skins' },
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
                <label className="block text-sm">
                  <span className="opacity-60">Wallet</span>
                  <input
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-sm font-mono"
                  />
                </label>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-white/10 p-3">
                    Discord {user.discord_id || '—'}
                  </div>
                  <div className="rounded-xl border border-white/10 p-3">
                    Telegram {user.telegram_id || '—'}
                  </div>
                </div>
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
                <h2 className="text-xl font-semibold mb-2">Gameverse</h2>
                <p className="text-sm opacity-60 mb-4">Play in the browser. P2E payouts come next.</p>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {GAMES.map((g) => (
                    <a
                      key={g.name}
                      href={g.href}
                      className="rounded-xl overflow-hidden border border-white/10 hover:border-emerald-400/40"
                    >
                      <div className="h-28 bg-black/40 overflow-hidden">
                        <img src={g.img} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="p-3 flex justify-between text-sm">
                        <span>{g.name}</span>
                        <span className="text-emerald-400 text-xs">{g.tag}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {tab === 'wallet' && (
              <div className="space-y-3">
                <h2 className="text-xl font-semibold">Wallet</h2>
                <p className="font-mono text-sm break-all opacity-80">{user.wallet_address || 'Not linked yet'}</p>
                <a href="https://wallet.futuret3ch.com.au" className="text-emerald-400 text-sm">
                  Open Infinite Wallet →
                </a>
              </div>
            )}

            {tab === 'messages' && (
              <Empty title="Messages" body="Inbox, sent and replies are coming back here — same account, cleaner layout than the old portal." />
            )}
            {tab === 'friends' && (
              <Empty title="Friends" body="Add, accept and message friends from this profile. The old lists will plug into this view." />
            )}
            {tab === 'chat' && (
              <Empty title="Live Chat" body="Group and private chat stay on your account. We are wiring the old rooms into this shell." />
            )}
            {tab === 'avatar' && (
              <div className="space-y-3">
                <h2 className="text-xl font-semibold">Avatar</h2>
                <input
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="Image URL"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-sm"
                />
                <button onClick={saveProfile} className="font-semibold text-black bg-emerald-400 px-4 py-2 rounded-full text-sm">
                  Save avatar
                </button>
              </div>
            )}
            {tab === 'nft' && <Empty title="NFT Multiverse" body="Pets, drops and on-chain items will list here against this wallet." />}
            {tab === 'leaderboard' && <Empty title="Leaderboard" body="Ranks from TAP games and arcade scores will land on this profile." />}
            {tab === 'intel' && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Intel Feed</h2>
                <ul className="text-sm opacity-70 space-y-2">
                  <li>• Android game client is live for licensed developers</li>
                  <li>• Portal login is the same account across Futuret3ch sites</li>
                  <li>• P2E payouts and Pro licenses are next</li>
                </ul>
                <Link href="/updates" className="inline-block mt-4 text-emerald-400 text-sm">
                  Site updates →
                </Link>
              </div>
            )}
            {tab === 'skins' && <Empty title="Portal skins" body="Light/dark already follow the main site. Extra skins will attach to this profile." />}
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
              Only people who switch to Developers need this. Regular users can ignore it.
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
            For shops, partners and studios — listings, $MT checkout and staff seats. Same
            login as users. This desk is opening next.
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
