import Link from 'next/link';
import SignalDesk from '@/components/games/SignalDesk';

export default function SignalPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap gap-4 text-sm mb-6">
        <Link href="/" className="opacity-70 hover:opacity-100">← Home</Link>
        <Link href="/catalog" className="opacity-70 hover:opacity-100">← Games</Link>
        <Link href="/boards?game=signal" className="opacity-70 hover:opacity-100">Signal board</Link>
      </div>
      <div className="text-xs uppercase tracking-[3px] text-emerald-400 mb-2">Live ticker</div>
      <h1 className="text-4xl font-semibold tracking-tight mb-2">Signal</h1>
      <p className="opacity-70 mb-8 max-w-2xl">Four glyphs. One coin. Lock the ticker before the candle closes.</p>
      <SignalDesk />
    </div>
  );
}
