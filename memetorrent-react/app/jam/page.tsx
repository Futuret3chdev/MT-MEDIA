import Link from 'next/link';
import StudioJam from '@/components/games/StudioJam';

export default function JamPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap gap-4 text-sm mb-6">
        <Link href="/" className="opacity-70 hover:opacity-100">← Home</Link>
        <Link href="/catalog" className="opacity-70 hover:opacity-100">← Games</Link>
      </div>
      <h1 className="text-4xl font-semibold tracking-tight mb-2">Studio Jam</h1>
      <p className="opacity-70 mb-6">Four bars. Tap the pads. Play it back. Staff can prize the night’s loop.</p>
      <StudioJam />
    </div>
  );
}
