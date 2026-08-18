import Link from 'next/link';
import RaidRug from '@/components/games/RaidRug';

export default function RaidPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap gap-4 text-sm mb-6">
        <Link href="/" className="opacity-70 hover:opacity-100">← Home</Link>
        <Link href="/catalog" className="opacity-70 hover:opacity-100">← Games</Link>
      </div>
      <h1 className="text-4xl font-semibold tracking-tight mb-2">Raid the Rug</h1>
      <p className="opacity-70 mb-6">2–4 players. One intern is pulling the rug. Eight minutes. Vote them out.</p>
      <RaidRug />
    </div>
  );
}
