'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const APK = '/downloads/MTGames.apk';

export default function SoftwareGamesPage() {
  const [licensed, setLicensed] = useState(false);
  const [key, setKey] = useState('');

  useEffect(() => {
    fetch('/api/portal/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.license_key) {
          setLicensed(true);
          setKey(d.user.license_key);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/" className="opacity-70 hover:opacity-100">← Home</Link>
        <Link href="/software" className="opacity-70 hover:opacity-100">← Software</Link>
      </div>
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mt-4 mb-2">Software · Games</div>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-1.6px] mb-4">
        Game software you can download.
      </h1>
      <p className="opacity-70 max-w-2xl mb-10 text-sm sm:text-base">
        Download the Android client with a developer license. iOS, Windows and macOS builds follow.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl p-6 border border-emerald-400/30" style={{ background: 'var(--card)' }}>
          <div className="flex items-center justify-between gap-3 mb-2">
            <h2 className="font-semibold text-xl">Android</h2>
            <span className="text-[11px] tracking-wide px-2 py-0.5 rounded-full border text-emerald-400 border-emerald-400/40">
              Live
            </span>
          </div>
          <p className="text-sm opacity-70 mb-5">
            MT Games for Android. Requires a developer license.
          </p>
          {licensed ? (
            <div className="space-y-3">
              <a
                href={APK}
                download
                className="inline-block font-semibold text-black bg-emerald-400 hover:bg-emerald-300 px-4 py-2 rounded-full text-sm"
              >
                Download Android APK
              </a>
              <div className="text-xs opacity-50 font-mono break-all">License {key}</div>
            </div>
          ) : (
            <Link
              href="/software/developers"
              className="inline-block font-semibold text-black bg-emerald-400 hover:bg-emerald-300 px-4 py-2 rounded-full text-sm"
            >
              Get free license first
            </Link>
          )}
        </div>

        {[
          ['iOS', 'App Store client.'],
          ['Windows', 'Desktop client.'],
          ['macOS', 'Mac client.'],
        ].map(([name, note]) => (
          <div key={name} className="rounded-2xl p-6 border border-white/10" style={{ background: 'var(--card)' }}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <h2 className="font-semibold text-xl">{name}</h2>
              <span className="text-[11px] tracking-wide px-2 py-0.5 rounded-full border opacity-50 border-white/15">Later</span>
            </div>
            <p className="text-sm opacity-70 mb-5">{note}</p>
            <span className="text-sm opacity-40">Available later</span>
          </div>
        ))}
      </div>
    </div>
  );
}
