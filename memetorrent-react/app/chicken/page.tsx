import Link from 'next/link';
import MtChicken from '@/components/games/MtChicken';

export default function ChickenPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex gap-4 text-sm mb-6">
        <Link href="/" className="opacity-70 hover:opacity-100">← Home</Link>
        <Link href="/catalog" className="opacity-70 hover:opacity-100">← Games</Link>
        <Link href="/boards?game=chicken" className="opacity-70 hover:opacity-100">Chicken board</Link>
      </div>
      <h1 className="text-4xl font-semibold mb-2">MT Chicken</h1>
      <p className="opacity-70 mb-6">3 lives. Shield and $MT in the road. Trucks. Night or day. Wallet + staff desk.</p>
      <MtChicken />
    </div>
  );
}
