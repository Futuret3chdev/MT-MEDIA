import Link from 'next/link';
import MtPac from '@/components/games/MtPac';

export default function PacPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex gap-4 text-sm mb-6">
        <Link href="/" className="opacity-70 hover:opacity-100">← Home</Link>
        <Link href="/catalog" className="opacity-70 hover:opacity-100">← Games</Link>
        <Link href="/boards?game=pacman" className="opacity-70 hover:opacity-100">Pac board</Link>
      </div>
      <h1 className="text-4xl font-semibold mb-2">MT Pac</h1>
      <p className="opacity-70 mb-6">Emerald maze. Gold dots. $MT orbs. Wallet + staff desk.</p>
      <MtPac />
    </div>
  );
}
