import Link from 'next/link';

const sections = [
  {
    href: '/software/games',
    title: 'Games',
    desc: 'Skin lab, score book, pads, cover stamp, party codes — plus the Android client.',
  },
  {
    href: '/studio',
    title: 'Game Studio',
    desc: 'Login, catalog, $MT checkout and inventory for your titles.',
  },
  {
    href: '/chat',
    title: 'Crypto chat',
    desc: 'Trades, general and support rooms. Sign in with your portal account.',
  },
  {
    href: '/software/developers',
    title: 'Developers',
    desc: 'Free license to build on the ecosystem. Paid Pro upgrade coming soon.',
  },
  {
    href: '/software/security',
    title: 'Security',
    desc: 'Shield, vault, seed, net, keys, plus Phish Scan, Clip Guard, Sign Desk, Allow List.',
  },
];

export default function SoftwarePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <Link href="/" className="text-sm opacity-70 hover:opacity-100">← Home</Link>
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mt-4 mb-2">Software</div>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-1.6px] mb-4">
        Software we build ourselves.
      </h1>
      <p className="opacity-70 max-w-2xl mb-10 text-sm sm:text-base">
        Games, developer licenses, and security tools for the MT-ECO SYSTEM.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-2xl p-6 border border-white/10 hover:bg-white/[0.03] transition"
            style={{ background: 'var(--card)' }}
          >
            <h2 className="font-semibold text-xl mb-2">{s.title}</h2>
            <p className="text-sm opacity-70">{s.desc}</p>
            <div className="mt-4 text-sm text-emerald-400">Open →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
