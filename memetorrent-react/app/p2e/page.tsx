import Link from 'next/link';
import { p2eGames } from '@/lib/mt-catalog';

export default function P2EPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-2">Play to earn</div>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-1.6px] mb-3">One library. Real games.</h1>
      <p className="opacity-70 max-w-2xl mb-8 text-sm sm:text-base">
        Every title here is the same one in the portal and on TAP. Scores go to your
        account. $MT seasons turn on when the cage is ready — not a fake live badge.
      </p>
      <div className="flex flex-wrap gap-3 mb-10 text-sm">
        <Link href="/catalog" className="text-emerald-400">Full catalog →</Link>
        <Link href="/portal" className="text-emerald-400">Portal library →</Link>
        <Link href="/casino" className="text-emerald-400">Casino →</Link>
        <Link href="/studio" className="text-emerald-400">Game Studio →</Link>
        <Link href="/chat" className="text-emerald-400">Crypto chat →</Link>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {p2eGames().map((g) => (
          <a
            key={g.id}
            href={g.play}
            className="rounded-2xl overflow-hidden border border-white/10 hover:border-emerald-400/40"
            style={{ background: 'var(--card)' }}
          >
            {g.img && (
              <div className="h-32 bg-black/40">
                <img src={g.img} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4">
              <div className="flex justify-between gap-2">
                <h2 className="font-semibold">{g.name}</h2>
                <span className="text-[11px] text-emerald-400 uppercase">{g.status}</span>
              </div>
              <p className="text-sm opacity-70 mt-1">{g.blurb}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
