'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type User = {
  username: string;
  email: string;
  wallet_address: string | null;
  license_key: string | null;
  license_tier: string;
};

export default function PortalPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/portal/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await fetch('/api/portal/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    window.location.href = '/';
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-20 opacity-60">Loading portal…</div>;
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20">
        <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-2">Portal</div>
        <h1 className="text-4xl font-semibold tracking-tight mb-4">Sign in to your profile</h1>
        <p className="opacity-70 mb-6">
          Your developer license lives on this account. Use the same login on any Futuret3ch
          site — you do not sign up again.
        </p>
        <p className="text-sm opacity-60">Use the account icon in the top bar to log in or register.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-2">Portal</div>
          <h1 className="text-4xl font-semibold tracking-tight">{user.username}</h1>
          <p className="opacity-60 mt-1">{user.email}</p>
        </div>
        <button onClick={logout} className="text-sm opacity-60 hover:opacity-100">
          Log out
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl p-6 border border-emerald-400/30" style={{ background: 'var(--card)' }}>
          <div className="text-xs tracking-[2px] text-emerald-400 mb-2">
            {(user.license_tier || 'free').toUpperCase()} LICENSE
          </div>
          <div className="font-mono text-lg sm:text-xl text-emerald-400 break-all mb-3">
            {user.license_key || 'Issuing…'}
          </div>
          <p className="text-sm opacity-70">
            This key is on your profile. Log in on another MT site with the same account and
            it is already there.
          </p>
        </div>

        <div className="rounded-2xl p-6 border border-white/10" style={{ background: 'var(--card)' }}>
          <h2 className="font-semibold text-xl mb-2">Downloads</h2>
          <p className="text-sm opacity-70 mb-4">Android is live. Other platforms later.</p>
          <Link
            href="/software/games"
            className="inline-block font-semibold text-black bg-emerald-400 hover:bg-emerald-300 px-4 py-2 rounded-full text-sm"
          >
            Get Android APK
          </Link>
        </div>

        <div className="rounded-2xl p-6 border border-white/10" style={{ background: 'var(--card)' }}>
          <h2 className="font-semibold text-xl mb-2">Wallet</h2>
          <p className="font-mono text-sm break-all opacity-70">
            {user.wallet_address || 'Not linked yet'}
          </p>
        </div>

        <div className="rounded-2xl p-6 border border-white/10" style={{ background: 'var(--card)' }}>
          <h2 className="font-semibold text-xl mb-2">Pro</h2>
          <p className="text-sm opacity-70 mb-3">
            Publish into TAP / P2E and unlock iOS, Windows and Mac when those clients ship.
          </p>
          <span className="text-sm opacity-40">Upgrade payments next</span>
        </div>
      </div>
    </div>
  );
}
