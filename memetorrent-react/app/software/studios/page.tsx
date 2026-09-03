import Link from 'next/link';

const studios = [
  {
    name: 'MT Android Studio',
    href: '/maker/',
    status: 'Live',
    blurb: 'Our Android IDE. Device lab (phone, fold, tablet, TV, watch, Auto) with no AVD images. Build APK in the app.',
    extra: 'Google’s IDE needs a 2GB+ system image per device. Ours boots skins instantly and runs two-player, replay, heatmap, $MT shop, web play.',
  },
  {
    name: 'MT Device Lab',
    href: '/maker/?mode=lab',
    status: 'Live',
    blurb: 'Farm of emulators in one window. Pixel, Fold, Tablet, Watch, TV, Auto at once.',
    extra: 'No emulator.img. No HAXM. Same game on every form factor.',
  },
  {
    name: 'MT Publisher',
    href: '/maker/',
    status: 'Live',
    blurb: 'Store listing designer inside the IDE: short desc, screenshots from the emulator, $MT IAP.',
    extra: 'Play Console is a separate website. Listing, shop, and build live in one studio.',
  },
  {
    name: 'MT iOS Studio',
    href: '/maker/',
    status: 'Live',
    blurb: 'Same project, iPhone/iPad skins in the device lab. Export Xcode project when you need App Store signing.',
    extra: 'Apple still signs store builds. Design and play do not need a Mac.',
  },
  {
    name: 'MT Asset Studio',
    href: '/software/games',
    status: 'Live',
    blurb: 'Tiles, brushes, timeline, particles, seeds. Built into Android Studio — not a third-party plugin.',
    extra: 'Android Studio has no sprite timeline or death heatmap.',
  },
  {
    name: 'MT Bot Studio',
    href: '/bot',
    status: 'Live',
    blurb: 'Command surface for the MT Telegram bot — /ca, /token, holders, charts.',
    extra: 'Not an Android tool. Same company studio family.',
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
        Not plugins for someone else’s IDE. Our studios compile, emulate, list, and ship. Android Studio is the flagship —
        Device Lab, Publisher, iOS, assets, and bots sit next to it.
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
                {s.status}
              </span>
            </div>
            <p className="text-sm opacity-80 mb-3">{s.blurb}</p>
            <p className="text-sm opacity-55">{s.extra}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
