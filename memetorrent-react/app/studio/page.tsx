import Link from 'next/link';

const clients = [
  { name: 'Web', status: 'Now', note: 'Publish and manage titles in the browser. Same portal login.' },
  { name: 'Android', status: 'Beta', note: 'MT Games APK — download after a developer license.' },
  { name: 'Windows', status: 'Later', note: 'Desktop studio after the web publisher is used for real.' },
];

export default function StudioPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-2">MT Game Studio</div>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-1.6px] mb-3">
        Our studio. Our store.
      </h1>
      <p className="opacity-70 max-w-2xl mb-8 text-sm sm:text-base">
        Not Unity-in-a-trenchcoat. A place to list a game, attach $MT / Rockets, and
        land it in the P2E library and portal — like a small Steam for this ecosystem.
      </p>
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {clients.map((c) => (
          <div key={c.name} className="rounded-2xl p-5 border border-white/10" style={{ background: 'var(--card)' }}>
            <div className="text-[11px] text-emerald-400 uppercase mb-1">{c.status}</div>
            <h2 className="font-semibold text-xl">{c.name}</h2>
            <p className="text-sm opacity-70 mt-2">{c.note}</p>
          </div>
        ))}
      </div>
      <ol className="text-sm opacity-80 space-y-2 mb-8">
        <li>1. Portal account (Users by default).</li>
        <li>2. Switch to Developers — free license.</li>
        <li>3. Submit a title. We list it on P2E + portal library.</li>
        <li>4. Pro unlocks paid listings and casino hooks.</li>
      </ol>
      <div className="flex flex-wrap gap-3">
        <Link href="/portal" className="font-semibold text-black bg-emerald-400 px-4 py-2 rounded-full text-sm">
          Open portal
        </Link>
        <Link href="/software/games" className="text-sm px-4 py-2 rounded-full border border-white/15">
          Android APK
        </Link>
        <Link href="/p2e" className="text-sm px-4 py-2 rounded-full border border-white/15">
          P2E library
        </Link>
      </div>
    </div>
  );
}
