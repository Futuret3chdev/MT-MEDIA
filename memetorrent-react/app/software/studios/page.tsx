import Link from 'next/link';

const studios = [
  {
    name: 'MT Android Studio',
    href: '/maker/',
    blurb: 'Level editor, Run, Build APK. The compiler.',
  },
  {
    name: 'MT Device Lab',
    href: '/studios/lab.html',
    blurb: 'Six-device farm. Screenshots, net throttle, crash reports into Play Console.',
  },
  {
    name: 'MT Publisher',
    href: '/studios/publisher.html',
    blurb: 'Store listing, feature graphic, $MT IAP, publish a title.',
  },
  {
    name: 'MT Play Console',
    href: '/studios/console.html',
    blurb: 'Internal / closed / production tracks, testers, crash inbox.',
  },
  {
    name: 'MT iOS Studio',
    href: '/studios/ios.html',
    blurb: 'iPhone 15 / SE / iPad skins, Info.plist, Export Xcode zip.',
  },
  {
    name: 'MT Asset Studio',
    href: '/studios/assets.html',
    blurb: '32×32 pixel frames, animation strip, particles, PNG sheet.',
  },
  {
    name: 'MT Photography',
    href: '/studios/photo.html',
    blurb: 'Restore an old house photo, warp the facade, render a 3D building, play it in-game.',
  },
  {
    name: 'MT World / 3D',
    href: '/studios/world.html',
    blurb: 'Voxel world + textured photo house from Photography Studio.',
  },
  {
    name: 'MT Bot Studio',
    href: '/studios/bot.html',
    blurb: 'Telegram UI. /ca /token /holders hit live MT APIs.',
  },
  {
    name: 'Shield Policy',
    href: '/studios/shield.html',
    blurb: 'Allowlist, clipboard, panic lock. Export policy.json for Shield clients.',
  },
  {
    name: 'Music / SFX',
    href: '/studios/music.html',
    blurb: '16-step tracker, four channels, export WAV.',
  },
  {
    name: 'Video Cut',
    href: '/studios/video.html',
    blurb: 'In/out points, play the cut, export WebM.',
  },
];

export default function StudiosPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/" className="opacity-70 hover:opacity-100">
          ← Home
        </Link>
        <Link href="/software" className="opacity-70 hover:opacity-100">
          ← Software
        </Link>
        <Link href="/software/games" className="opacity-70 hover:opacity-100">
          Games
        </Link>
      </div>
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mt-4 mb-2">Software · Studios</div>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-1.6px] mb-4">Studio software we build.</h1>
      <p className="opacity-70 max-w-2xl mb-10 text-sm sm:text-base">
        Each card is a different app. Device Lab is a farm. Publisher is the store listing. Play Console is rollouts.
        Photography turns a house photo into a rendered game building.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {studios.map((s) => (
          <a
            key={s.name}
            href={s.href}
            className="rounded-2xl p-6 border border-emerald-400/30 hover:bg-white/[0.03] transition"
            style={{ background: 'var(--card)' }}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <h2 className="font-semibold text-xl">{s.name}</h2>
              <span className="text-[11px] tracking-wide px-2 py-0.5 rounded-full border text-emerald-400 border-emerald-400/40">
                Live
              </span>
            </div>
            <p className="text-sm opacity-80">{s.blurb}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
