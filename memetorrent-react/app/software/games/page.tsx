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
        Maker writes the game. Android Studio still compiles the APK. Xcode still signs iOS.
        SDK:{' '}
        <Link href="/software/games/sdk" className="text-emerald-400">
          /software/games/sdk
        </Link>
        .
      </p>

      <div className="rounded-2xl border border-white/10 p-6 mb-8" style={{ background: 'var(--card)' }}>
        <div className="text-emerald-400 text-xs tracking-[2px] mb-2">How Android games get made</div>
        <h2 className="font-semibold text-xl mb-3">MT Maker → Android Studio → APK</h2>
        <ol className="text-sm opacity-80 space-y-2 list-decimal pl-5 mb-4">
          <li>Paint the level in MT Maker (Windows, Mac, phone, or in this browser).</li>
          <li>Export Android Studio project — a Gradle folder with your game in <code className="text-emerald-400">app/src/main/assets/index.html</code>.</li>
          <li>Open that folder in Android Studio (File → Open). That is the normal Android app workflow.</li>
          <li>Green Run for a phone / emulator. Build → Generate Signed Bundle / APK for Play.</li>
        </ol>
        <p className="text-sm opacity-60 mb-4">
          Maker does not replace Android Studio. Same for iOS: Export Xcode project, then Archive in Xcode.
        </p>
        <a href="/maker/" className="inline-block font-semibold text-black bg-emerald-400 hover:bg-emerald-300 px-4 py-2 rounded-full text-sm">
          Open Maker in this browser
        </a>
      </div>

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
            note: 'Paint a level, play it, Export game.html or Export Android Studio project. Runs on this PC.',
            href: '/downloads/MTMaker.exe',
            label: 'Download MT Maker (.exe)',
          },
          {
            name: 'Android Maker',
            note: 'Make the game on the phone, then Export Android Studio project and copy the zip to a PC. Open that folder in Android Studio to compile the APK — Studio still builds it.',
            href: '/downloads/MTMaker.apk',
            label: 'Download Maker APK',
            extra: { href: APK, label: 'Play client APK (MT Games)' },
          },
          {
            name: 'Mac · iOS Maker',
            note: 'Make the game on the Mac. Export Xcode project, open MTMadeGame.xcodeproj, then Archive. Xcode still signs.',
            href: '/downloads/MTMaker-macos-arm.zip',
            label: 'Download Maker (Apple Silicon)',
            extra: { href: '/downloads/MTMaker-macos.zip', label: 'Intel Mac' },
          },
          {
            name: 'iOS (App Store project)',
            note: 'Xcode project of the maker app itself (not a game you painted). Archive on a Mac with an Apple Developer account.',
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
