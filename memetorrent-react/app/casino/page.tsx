'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import GameCard from '@/components/games/GameCard';
import { casinoGames } from '@/lib/mt-catalog';

export default function CasinoPage() {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('mt-18') === '1') setOk(true);
  }, []);

  const enter = () => {
    sessionStorage.setItem('mt-18', '1');
    setOk(true);
  };

  if (!ok) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-2">18+</div>
        <h1 className="text-3xl font-semibold mb-3">Adult games</h1>
        <p className="text-sm opacity-70 mb-6">
          This section is for people 18 or older. Nova Poker and other 18+ tables live here only.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={enter}
            className="font-semibold text-black bg-emerald-400 px-5 py-2 rounded-full text-sm"
          >
            I am 18 or older
          </button>
          <Link href="/catalog" className="px-5 py-2 rounded-full border border-white/15 text-sm">
            Back to games
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex flex-wrap gap-4 text-sm mb-6">
        <Link href="/catalog" className="opacity-70 hover:opacity-100">
          ← All-ages games
        </Link>
        <Link href="/" className="opacity-70 hover:opacity-100">
          ← Home
        </Link>
      </div>
      <div className="uppercase text-xs tracking-[3px] text-amber-400 mb-2">18+ only</div>
      <h1 className="text-4xl font-semibold tracking-tight mb-3">Adult games</h1>
      <p className="opacity-70 max-w-2xl mb-8 text-sm">
        Kept off the main Games list. No 18+ titles are listed right now.
      </p>
      {!casinoGames().length && (
        <p className="text-sm opacity-50">Nothing here. Regular games are on the catalog.</p>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {casinoGames().map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </div>
    </div>
  );
}
