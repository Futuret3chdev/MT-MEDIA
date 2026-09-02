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
        MT Android Studio
      </h1>
      <p className="opacity-70 max-w-2xl mb-10 text-sm sm:text-base">
        Our own Android IDE. Paint a game, ▶ Run it, hit Build APK. The APK is compiled and signed here —
        you do not need Google’s Android Studio. SDK:{' '}
        <Link href="/software/games/sdk" className="text-emerald-400">
          /software/games/sdk
        </Link>
        .
      </p>

      <div className="rounded-2xl border border-white/10 p-6 mb-8" style={{ background: 'var(--card)' }}>
        <div className="text-emerald-400 text-xs tracking-[2px] mb-2">Our Android Studio</div>
        <h2 className="font-semibold text-xl mb-3">Design → Run → Build APK</h2>
        <ol className="text-sm opacity-80 space-y-2 list-decimal pl-5 mb-4">
          <li>Open MT Android Studio (Windows, Mac, or the Android app).</li>
          <li>Paint the level in the Design editor. ▶ Run previews it in the IDE.</li>
          <li>Build APK — this IDE packages and signs the Android app. Sideload the .apk on a phone.</li>
        </ol>
        <p className="text-sm opacity-60 mb-4">
          Google Android Studio is not part of this path. MT Android Studio is the compiler.
        </p>
        <a href="/maker/" className="inline-block font-semibold text-black bg-emerald-400 hover:bg-emerald-300 px-4 py-2 rounded-full text-sm">
          Open MT Android Studio in this browser
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
            name: 'Windows · MT Android Studio',
            note: 'Standalone IDE. Design, Run, Build APK on this PC. Install the .apk on any Android phone.',
            href: '/downloads/MTStudio.exe',
            label: 'Download MT Android Studio (.exe)',
            extra: { href: '/downloads/MTMaker.exe', label: 'Same app as MTMaker.exe' },
          },
          {
            name: 'Android · MT Android Studio',
            note: 'The same IDE on a phone. Design and Run here. Build APK from the Windows or Mac IDE.',
            href: '/downloads/MTStudio.apk',
            label: 'Download Studio APK',
            extra: { href: APK, label: 'Play client APK (MT Games)' },
          },
          {
            name: 'Mac · MT Android Studio',
            note: 'The same IDE on a Mac. Build APK from here. iOS listing still uses Xcode on a Mac with an Apple account.',
            href: '/downloads/MTStudio-macos-arm.zip',
            label: 'Download Studio (Apple Silicon)',
            extra: { href: '/downloads/MTStudio-macos.zip', label: 'Intel Mac' },
          },
          {
            name: 'iOS (App Store project)',
            note: 'Xcode project of this IDE itself. Archive on a Mac with an Apple Developer account.',
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
