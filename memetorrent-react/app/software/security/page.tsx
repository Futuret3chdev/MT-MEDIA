import Link from 'next/link';

const tools = [
  {
    id: 'shield',
    name: 'Shield',
    tag: 'Core',
    desc: 'Site and wallet guard. Client-side keys, signed traffic, no seed on any server.',
    status: 'Live on the stack',
  },
  {
    id: 'vaultlock',
    name: 'Vault Lock',
    tag: '$MT exclusive',
    desc: 'Local vault that freezes outgoing $MT over a limit until you confirm twice.',
    status: 'In build',
  },
  {
    id: 'seedguard',
    name: 'Seed Guard',
    tag: '$MT exclusive',
    desc: 'Offline phrase check and shamir split. Never uploads the words.',
    status: 'In build',
  },
  {
    id: 'netwatch',
    name: 'Net Watch',
    tag: '$MT exclusive',
    desc: 'Watch RPC and claim endpoints for spoof hosts before you sign.',
    status: 'In build',
  },
  {
    id: 'keyring',
    name: 'Key Ring',
    tag: '$MT exclusive',
    desc: 'Named keys on this device only. Switch rings without leaving the browser.',
    status: 'In build',
  },
];

export default function SoftwareSecurityPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/" className="opacity-70 hover:opacity-100">
          ← Home
        </Link>
        <Link href="/software" className="opacity-70 hover:opacity-100">
          ← Software
        </Link>
      </div>
      <div className="uppercase text-xs tracking-[3px] text-emerald-400 mt-4 mb-2">Software · Security</div>
      <h1 className="text-4xl font-semibold tracking-tight mb-4">Security software.</h1>
      <p className="opacity-70 mb-10 max-w-2xl">
        Shield is the core. Beside it: exclusive tools we build here. No third-party antivirus brand. Keys stay on the device.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {tools.map((t) => (
          <div key={t.id} className="rounded-2xl border border-white/10 p-6 bg-white/[0.02]">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h2 className="text-xl font-semibold">{t.name}</h2>
              <span className={`text-[10px] uppercase tracking-[1px] px-2 py-1 rounded-full ${
                t.tag.includes('$MT') ? 'text-amber-300 border border-amber-300/40' : 'text-emerald-400 border border-emerald-400/40'
              }`}>
                {t.tag}
              </span>
            </div>
            <p className="text-sm opacity-70 mb-3">{t.desc}</p>
            <div className="text-xs opacity-50">{t.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
