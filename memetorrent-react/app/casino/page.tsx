import Link from 'next/link';
import { casinoGames, p2eGames } from '@/lib/mt-catalog';

export default function CasinoPage() {
  const house = casinoGames()[0];
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-2">Casino</div>
      <h1 className="text-4xl font-semibold tracking-tight mb-3">The house is live.</h1>
      <p className="opacity-70 max-w-2xl mb-8 text-sm">
        Tables run on our Poker Stars app. Arcade and P2E stay in the same library and
        the same portal login — this is just the cage.
      </p>

      {house && (
        <a
          href={house.play}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl p-6 border border-emerald-400/30 mb-10 hover:bg-white/[0.03]"
          style={{ background: 'var(--card)' }}
        >
          <div className="text-[11px] uppercase text-emerald-400 mb-1">Live · {house.name}</div>
          <h2 className="text-2xl font-semibold">Open Poker Stars</h2>
          <p className="text-sm opacity-70 mt-2">{house.blurb}</p>
          <div className="mt-4 font-semibold text-emerald-400 text-sm">Play at poker-stars.vercel.app →</div>
        </a>
      )}

      <h2 className="font-semibold mb-3">Also in the P2E library</h2>
      <div className="flex flex-wrap gap-2 text-sm">
        {p2eGames().map((g) => (
          <Link key={g.id} href={g.play} className="px-3 py-1 rounded-full border border-white/15 opacity-80 hover:opacity-100">
            {g.name}
          </Link>
        ))}
        <Link href="/p2e" className="px-3 py-1 rounded-full border border-emerald-400/40 text-emerald-400">
          Full P2E →
        </Link>
        <Link href="/portal" className="px-3 py-1 rounded-full border border-white/15">
          Portal library →
        </Link>
      </div>
    </div>
  );
}
