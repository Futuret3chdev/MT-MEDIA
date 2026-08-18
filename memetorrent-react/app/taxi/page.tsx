import Link from 'next/link';
import RadioTaxi from '@/components/games/RadioTaxi';

export default function TaxiPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap gap-4 text-sm mb-6">
        <Link href="/" className="opacity-70 hover:opacity-100">← Home</Link>
        <Link href="/catalog" className="opacity-70 hover:opacity-100">← Games</Link>
        <Link href="/boards?game=taxi" className="opacity-70 hover:opacity-100">Taxi board</Link>
      </div>
      <h1 className="text-4xl font-semibold tracking-tight mb-2">Radio Taxi</h1>
      <p className="opacity-70 mb-6">Drive the plaza. Pick up the glow. Drop at Gallery, Studio, Museum, or Casino.</p>
      <RadioTaxi />
    </div>
  );
}
