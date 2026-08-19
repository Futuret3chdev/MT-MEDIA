import Link from 'next/link';
import MtTetris from '@/components/games/MtTetris';

export default function TetrisPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex gap-4 text-sm mb-6">
        <Link href="/" className="opacity-70 hover:opacity-100">← Home</Link>
        <Link href="/catalog" className="opacity-70 hover:opacity-100">← Games</Link>
        <Link href="/boards?game=tetris" className="opacity-70 hover:opacity-100">Tetris board</Link>
      </div>
      <h1 className="text-4xl font-semibold mb-2">MT Tetris</h1>
      <p className="opacity-70 mb-6">Pick a mode first. Hold, next-3, ghost, hard drop stay. DAS + 180 on top. Wallet + staff desk.</p>
      <MtTetris />
    </div>
  );
}
