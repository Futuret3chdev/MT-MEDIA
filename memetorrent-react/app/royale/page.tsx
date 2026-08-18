import Link from 'next/link';
import EmojiRoyale from '@/components/games/EmojiRoyale';

export default function RoyalePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex flex-wrap gap-4 text-sm mb-6">
        <Link href="/" className="opacity-70 hover:opacity-100">
          ← Home
        </Link>
        <Link href="/catalog" className="opacity-70 hover:opacity-100">
          ← Games
        </Link>
        <Link href="/emoji" className="opacity-70 hover:opacity-100">
          Solo Emoji Guess
        </Link>
      </div>
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-2">Live room</div>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-2">Emoji Royale</h1>
      <p className="opacity-70 mb-8 max-w-2xl">
        One card for the whole pit. Fourteen seconds. Lock your call. Reveal together. Tonight’s board is its own
        war — not the solo night.
      </p>
      <EmojiRoyale />
    </div>
  );
}
