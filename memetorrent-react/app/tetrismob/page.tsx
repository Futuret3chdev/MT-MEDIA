import Link from 'next/link';
import MtTetris from '@/components/games/MtTetris';

export default function TetrisMobPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex gap-4 text-sm mb-6">
        <Link href="/" className="opacity-70 hover:opacity-100">← Home</Link>
        <Link href="/catalog" className="opacity-70 hover:opacity-100">← Games</Link>
        <Link href="/boards?game=tetrismob" className="opacity-70 hover:opacity-100">Mob board</Link>
      </div>
      <h1 className="text-4xl font-semibold mb-2">Tetris Mob</h1>
      <p className="opacity-70 mb-6">Swipe to stack. Hold and hard-drop pads. Long-press hold. Wallet + staff desk.</p>
      <MtTetris mob />
    </div>
  );
}
