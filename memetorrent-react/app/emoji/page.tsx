import Link from 'next/link';
import EmojiNight from '@/components/games/EmojiNight';

export default function EmojiPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex flex-wrap gap-4 text-sm mb-6">
        <Link href="/" className="opacity-70 hover:opacity-100">
          ← Home
        </Link>
        <Link href="/catalog" className="opacity-70 hover:opacity-100">
          ← Games
        </Link>
        <Link href="/boards?game=emoji" className="opacity-70 hover:opacity-100">
          Emoji board
        </Link>
      </div>
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-2">Community night</div>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-2">Emoji Guess</h1>
      <p className="opacity-70 mb-8 max-w-2xl">
        Read the glyphs. Type the title. Streaks light $MT neon. Staff set the prize from the desk — not the flyer.
      </p>
      <EmojiNight />
    </div>
  );
}
