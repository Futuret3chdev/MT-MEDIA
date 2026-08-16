import Link from 'next/link';
import { p2eGames } from '@/lib/mt-catalog';

export default function CasinoPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-2">Casino</div>
      <h1 className="text-4xl font-semibold tracking-tight mb-3">Our house. Our tables.</h1>
      <p className="opacity-70 max-w-2xl mb-8 text-sm">
        Third-party tables are out. Casino games we build will land here and in the
        portal library. Until a table is ours and live, this desk stays empty.
      </p>
      <h2 className="font-semibold mb-3">Playable now in P2E</h2>
      <div className="flex flex-wrap gap-2 text-sm">
        {p2eGames().map((g) => (
          <Link key={g.id} href={g.play} className="px-3 py-1 rounded-full border border-white/15 opacity-80 hover:opacity-100">
            {g.name}
          </Link>
        ))}
        <Link href="/p2e" className="px-3 py-1 rounded-full border border-emerald-400/40 text-emerald-400">
          Full P2E →
        </Link>
      </div>
    </div>
  );
}
