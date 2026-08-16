'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type License = {
  name: string;
  email: string;
  handle: string | null;
  license_key: string;
  tier: string;
};

export default function SoftwareDevelopersPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [license, setLicense] = useState<License | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mt_dev_license');
      if (raw) setLicense(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/software/developers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, handle }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'Signup failed.');
        return;
      }
      setLicense(data.license);
      localStorage.setItem('mt_dev_license', JSON.stringify(data.license));
    } catch {
      setError('Network error. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <Link href="/software" className="text-sm opacity-60 hover:opacity-100">← Software</Link>
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mt-4 mb-2">Software · Developers</div>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-1.6px] mb-4">
        Sign up. Get a free license. Build.
      </h1>
      <p className="opacity-70 max-w-2xl mb-10 text-sm sm:text-base">
        Free is for building and testing. Pro is for shipping on the MT-ECO SYSTEM —
        games, TAP, wallets, and $MT. Android is first. iOS, Windows and Mac come later.
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-12">
        <div className="rounded-2xl p-6 border border-white/10" style={{ background: 'var(--card)' }}>
          <div className="text-emerald-400 text-xs tracking-[2px] mb-2">FREE</div>
          <h2 className="text-2xl font-semibold mb-2">Builder license</h2>
          <ul className="text-sm opacity-70 space-y-2 mb-6">
            <li>• Download the Android game client when the APK is posted</li>
            <li>• Build and test against our APIs</li>
            <li>• One personal license key</li>
          </ul>
          <p className="text-sm opacity-50">$0 — sign up on this page</p>
        </div>
        <div className="rounded-2xl p-6 border border-emerald-400/30" style={{ background: 'var(--card)' }}>
          <div className="text-emerald-400 text-xs tracking-[2px] mb-2">PRO</div>
          <h2 className="text-2xl font-semibold mb-2">Ecosystem license</h2>
          <ul className="text-sm opacity-70 space-y-2 mb-6">
            <li>• Publish titles into TAP / P2E</li>
            <li>• $MT and Rockets hooks</li>
            <li>• iOS, Windows and Mac when those clients ship</li>
          </ul>
          <p className="text-sm opacity-50">Upgrade path after you have a free key. Payments next.</p>
        </div>
      </div>

      {license ? (
        <div className="rounded-2xl p-6 border border-emerald-400/30">
          <div className="uppercase text-xs tracking-[2px] text-emerald-400 mb-2">Your license</div>
          <div className="font-mono text-lg sm:text-2xl text-emerald-400 break-all mb-3">{license.license_key}</div>
          <p className="text-sm opacity-70 mb-4">
            {license.name} · {license.email} · {license.tier.toUpperCase()}
          </p>
          <Link href="/software/games" className="text-sm text-emerald-400 hover:underline">
            Go to game downloads →
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="rounded-2xl p-6 border border-white/10 max-w-lg space-y-3">
          <h2 className="font-semibold text-xl mb-2">Create a free developer license</h2>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-sm"
          />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-sm"
          />
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="Telegram or X handle (optional)"
            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-sm"
          />
          {error && <div className="text-sm text-red-400">{error}</div>}
          <button
            type="submit"
            disabled={busy}
            className="font-semibold text-black bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 px-4 py-2 rounded-full text-sm"
          >
            {busy ? 'Issuing…' : 'Get free license'}
          </button>
        </form>
      )}
    </div>
  );
}
