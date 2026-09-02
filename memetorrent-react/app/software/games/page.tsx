'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import GameSuite from '@/components/software/GameSuite';

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
        Game software you can use.
      </h1>
      <p className="opacity-70 max-w-2xl mb-10 text-sm sm:text-base">
        Browser tools for nights and builds — skin lab, score book, pads, covers. Android client uses a builder license.
        Game software SDK:{' '}
        <Link href="/software/games/sdk" className="text-emerald-400">
          /software/games/sdk
        </Link>
        .
      </p>

      <div className="rounded-2xl border border-emerald-400/30 p-6 mb-8" style={{ background: 'var(--card)' }}>
        <div className="text-emerald-400 text-xs tracking-[2px] mb-2">SDK</div>
        <h2 className="font-semibold text-xl mb-2">MT Games SDK</h2>
        <p className="text-sm opacity-70 mb-4">
          License check, scores, party codes for your APK / desktop client. Not the catalog Play iframe SDK.
        </p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/software/games/sdk" className="font-semibold text-black bg-emerald-400 px-4 py-2 rounded-full">
            Docs
          </Link>
          <a href="/sdk/mt-games.js" className="px-4 py-2 rounded-full border border-white/20">
            mt-games.js
          </a>
          <a href="/sdk/games-example.html" className="px-4 py-2 rounded-full border border-white/20">
            Example
          </a>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {[
          {
            name: 'Windows Maker',
            note: 'Standalone MT Maker. Paint a level, play it, export a .html game. Runs on this PC — not a website tab.',
            href: '/downloads/MTMaker.exe',
            label: 'Download MT Maker (.exe)',
          },
          {
            name: 'Android Maker',
            note: 'Make games on the phone. Simpler than Android Studio: paint, play, export. Sideload APK; sign an AAB for Play.',
            href: '/downloads/MTMaker.apk',
            label: 'Download Maker APK',
            extra: { href: APK, label: 'Play client APK (MT Games)' },
          },
          {
            name: 'Mac · iOS Maker',
            note: 'MT Maker on the Mac. Export HTML games here; use the Xcode zip on a Mac to put a title on the App Store.',
            href: '/downloads/MTMaker-macos-arm.zip',
            label: 'Download Maker (Apple Silicon)',
            extra: { href: '/downloads/MTMaker-macos.zip', label: 'Intel Mac' },
          },
          {
            name: 'iOS (App Store project)',
            note: 'Xcode project of the maker. Archive on a Mac with an Apple Developer account.',
            href: '/downloads/MTMaker-ios-xcode.zip',
            label: 'Download Xcode project',
          },
        ].map((p) => (
          <div key={p.name} className="rounded-2xl p-6 border border-emerald-400/30" style={{ background: 'var(--card)' }}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <h2 className="font-semibold text-xl">{p.name}</h2>
              <span className="text-[11px] tracking-wide px-2 py-0.5 rounded-full border text-emerald-400 border-emerald-400/40">
                Live
              </span>
            </div>
            <p className="text-sm opacity-70 mb-5">{p.note}</p>
            {licensed ? (
              <div className="space-y-3">
                <a
                  href={p.href}
                  download
                  className="inline-block font-semibold text-black bg-emerald-400 hover:bg-emerald-300 px-4 py-2 rounded-full text-sm"
                >
                  {p.label}
                </a>
                {p.extra && (
                  <a href={p.extra.href} download className="block text-sm text-emerald-400">
                    {p.extra.label} →
                  </a>
                )}
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
        ))}
      </div>

      <h2 className="text-2xl font-semibold mt-14 mb-3">Tools in this browser.</h2>
      <p className="opacity-70 mb-6 max-w-2xl text-sm">Open a card. Nothing uploads. Use them on a night or while you build.</p>
      <GameSuite />
    </div>
  );
}
