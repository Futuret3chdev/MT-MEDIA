import Link from 'next/link';
import MtTap from '@/components/games/MtTap';

export default function TapPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap gap-4 text-sm mb-6">
        <Link href="/" className="opacity-70 hover:opacity-100">
          ← Home
        </Link>
        <Link href="/catalog" className="opacity-70 hover:opacity-100">
          ← Games
        </Link>
        <Link href="/boards?game=tap" className="opacity-70 hover:opacity-100">
          Tap board
        </Link>
      </div>
      <div className="text-xs uppercase tracking-[3px] text-emerald-400 mb-2">Core loop</div>
      <h1 className="text-4xl font-semibold tracking-tight mb-2">MT Tap</h1>
      <p className="opacity-70 mb-6 max-w-2xl">
        Hit the green. Skip the rugs. Combos go neon $MT. Six modes. Wallet + staff desk same as the other nights.
      </p>
      <MtTap />
    </div>
  );
}
