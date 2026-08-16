import Link from 'next/link';

const platforms = [
  {
    name: 'Android',
    status: 'First release',
    ready: true,
    note: 'APK for phones and tablets. Sign up as a developer to unlock the download.',
    href: '/software/developers',
    cta: 'Get free license + Android',
  },
  {
    name: 'iOS',
    status: 'Later',
    ready: false,
    note: 'App Store build after the Android client is stable.',
  },
  {
    name: 'Windows',
    status: 'Later',
    ready: false,
    note: 'Desktop client once the Android loop is proven.',
  },
  {
    name: 'macOS',
    status: 'Later',
    ready: false,
    note: 'Signed Mac build comes after Windows.',
  },
];

export default function SoftwareGamesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <Link href="/software" className="text-sm opacity-60 hover:opacity-100">← Software</Link>
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mt-4 mb-2">Software · Games</div>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-1.6px] mb-4">
        Game software you can download.
      </h1>
      <p className="opacity-70 max-w-2xl mb-10 text-sm sm:text-base">
        Start on Android. Sign up as a developer, get a free license to build,
        then upgrade to Pro to publish on the MT-ECO SYSTEM. iOS, Windows and
        Mac stay listed so the path is obvious — they are not ready yet.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {platforms.map((p) => (
          <div
            key={p.name}
            className="rounded-2xl p-6 border border-white/10"
            style={{ background: 'var(--card)' }}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <h2 className="font-semibold text-xl">{p.name}</h2>
              <span
                className={`text-[11px] tracking-wide px-2 py-0.5 rounded-full border ${
                  p.ready
                    ? 'text-emerald-400 border-emerald-400/40'
                    : 'opacity-50 border-white/15'
                }`}
              >
                {p.status}
              </span>
            </div>
            <p className="text-sm opacity-70 mb-5">{p.note}</p>
            {p.ready && p.href ? (
              <Link
                href={p.href}
                className="inline-block font-semibold text-black bg-emerald-400 hover:bg-emerald-300 px-4 py-2 rounded-full text-sm"
              >
                {p.cta}
              </Link>
            ) : (
              <span className="text-sm opacity-40">Available later</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
