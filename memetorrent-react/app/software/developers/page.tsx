'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type User = {
  username: string;
  email: string;
  license_key: string | null;
  license_tier: string;
};

export default function SoftwareDevelopersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/portal/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  const upgrade = async () => {
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/portal/license', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upgrade' }),
      });
      const d = await res.json();
      if (!d.ok) {
        setMsg(d.error || 'Could not upgrade');
        return;
      }
      setUser((u) =>
        u
          ? { ...u, license_key: d.license_key || d.user?.license_key, license_tier: 'pro' }
          : u
      );
      setMsg('Upgraded. Your Pro key is on this profile.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/" className="opacity-70 hover:opacity-100">← Home</Link>
        <Link href="/software" className="opacity-70 hover:opacity-100">← Software</Link>
      </div>
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mt-4 mb-2">Software · Developers</div>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-1.6px] mb-4">
        One account. One license. Every MT site.
      </h1>
      <p className="opacity-70 max-w-2xl mb-10 text-sm sm:text-base">
        Sign in to receive a free builder license on your portal profile. One account works across MT sites.
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-12">
        <div className="rounded-2xl p-6 border border-white/10" style={{ background: 'var(--card)' }}>
          <div className="text-emerald-400 text-xs tracking-[2px] mb-2">FREE</div>
          <h2 className="text-2xl font-semibold mb-2">Builder license</h2>
          <ul className="text-sm opacity-70 space-y-2">
            <li>• Issued automatically on your profile</li>
            <li>• Android game client download</li>
            <li>• Same key on every Futuret3ch site</li>
          </ul>
        </div>
        <div className="rounded-2xl p-6 border border-emerald-400/30" style={{ background: 'var(--card)' }}>
          <div className="text-emerald-400 text-xs tracking-[2px] mb-2">PRO</div>
          <h2 className="text-2xl font-semibold mb-2">Ecosystem license</h2>
          <ul className="text-sm opacity-70 space-y-2 mb-4">
            <li>• Publish into TAP / P2E</li>
            <li>• $MT and Rockets hooks</li>
            <li>• iOS, Windows and Mac when those clients ship</li>
          </ul>
          {user && (user.license_tier || 'free') !== 'pro' && (
            <button
              type="button"
              disabled={busy}
              onClick={upgrade}
              className="font-semibold text-black bg-emerald-400 px-4 py-2 rounded-full text-sm disabled:opacity-50"
            >
              {busy ? 'Upgrading…' : 'Upgrade to Pro'}
            </button>
          )}
        </div>
      </div>

      {!ready ? (
        <p className="opacity-50 text-sm">Checking your profile…</p>
      ) : user ? (
        <div className="rounded-2xl p-6 border border-emerald-400/30">
          <div className="uppercase text-xs tracking-[2px] text-emerald-400 mb-2">On your profile</div>
          <div className="font-mono text-lg sm:text-2xl text-emerald-400 break-all mb-3">{user.license_key}</div>
          <p className="text-sm opacity-70 mb-4">
            {user.username} · {user.email} · {(user.license_tier || 'free').toUpperCase()}
          </p>
          {msg && <p className="text-sm text-emerald-400 mb-3">{msg}</p>}
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/portal" className="text-emerald-400 hover:underline">Open portal →</Link>
            <Link href="/software/games" className="text-emerald-400 hover:underline">Download Android →</Link>
            {(user.license_tier || 'free') !== 'pro' && (
              <button type="button" disabled={busy} onClick={upgrade} className="text-emerald-400 hover:underline">
                {busy ? 'Upgrading…' : 'Upgrade to Pro →'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm opacity-70">
          Use the <b>account icon</b> in the top bar to create or enter your portal.
          A free license is written to that profile on first login.
        </p>
      )}
    </div>
  );
}
