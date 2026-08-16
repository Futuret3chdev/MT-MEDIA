import Link from 'next/link';
import { casinoGames, p2eGames } from '@/lib/mt-catalog';

export default function CasinoPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-2">Casino</div>
      <h1 className="text-4xl font-semibold tracking-tight mb-3">House games. Same account.</h1>
      <p className="opacity-70 max-w-2xl mb-8 text-sm">
        Tables use the portal login and $MT chips. Arcade P2E stays next door — we do
        not pretend blackjack is live until the table is real.
      </p>
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {casinoGames().map((g) => (
          <div key={g.id} className="rounded-2xl p-6 border border-white/10" style={{ background: 'var(--card)' }}>
            <div className="text-[11px] uppercase text-emerald-400 mb-1">{g.status}</div>
            <h2 className="text-xl font-semibold">{g.name}</h2>
            <p className="text-sm opacity-70 mt-2">{g.blurb}</p>
          </div>
        ))}
      </div>
      <h2 className="font-semibold mb-3">Also in the library</h2>
      <div className="flex flex-wrap gap-2 text-sm">
        {p2eGames().slice(0, 6).map((g) => (
          <Link key={g.id} href={g.play} className="px-3 py-1 rounded-full border border-white/15 opacity-80 hover:opacity-100">
            {g.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
