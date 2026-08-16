import Link from 'next/link';

export default function StudioLandingPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
      <div className="flex flex-wrap gap-4 text-sm mb-8">
        <Link href="/" className="opacity-70 hover:opacity-100">← Home</Link>
      </div>
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-3">MT Studio SDK</div>
      <h1 className="text-3xl sm:text-6xl font-semibold tracking-[-1.5px] sm:tracking-[-2px] mb-5 max-w-3xl">
        Game monetization.<br />Four API calls.
      </h1>
      <p className="opacity-70 max-w-xl text-base mb-8">
        Authenticate players, load the store, take $MT, deliver items. One integration
        for web, Android and Windows. Checkout through Infinite Wallet.
      </p>
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-12 sm:mb-16">
        <Link
          href="/studio/publish"
          className="px-6 py-3 rounded-2xl bg-emerald-400 text-black font-semibold text-sm text-center"
        >
          Get started
        </Link>
        <Link
          href="/studio/demo"
          className="px-6 py-3 rounded-2xl border border-white/25 font-semibold text-sm text-center"
        >
          Try SDK demo
        </Link>
        <Link
          href="/studio/editor"
          className="px-6 py-3 rounded-2xl border border-white/25 font-semibold text-sm text-center"
        >
          Open editor
        </Link>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 text-sm">
        <div className="rounded-2xl border border-white/10 p-5">
          <div className="text-3xl font-semibold text-emerald-400 mb-1">4</div>
          Auth, catalog, purchase, fulfill
        </div>
        <div className="rounded-2xl border border-white/10 p-5">
          <div className="text-3xl font-semibold text-emerald-400 mb-1">$MT</div>
          Priced in MT. Inventory on the player account
        </div>
        <div className="rounded-2xl border border-white/10 p-5">
          <div className="text-3xl font-semibold text-emerald-400 mb-1">1</div>
          Portal login across every client you ship
        </div>
      </div>
    </div>
  );
}
