import Link from 'next/link';
import type { Metadata } from 'next';
import BackLink from './BackLink';
import { articlesByGroup, SHIELD_ARTICLES } from '@/lib/shieldHelp';

export const metadata: Metadata = {
  title: 'Shield · Futuret3ch',
  description:
    'Shield: live grid and live tracking for this device. 14-day trial. Nothing fake. Built for everyone, including people in stalking situations.',
};

const ICONS = {
  mark: '/icons/shield-mark.jpg',
  grid: '/icons/shield-grid.jpg',
  map: '/icons/shield-map.jpg',
  guide: '/icons/shield-guide.jpg',
  family: '/icons/shield-family.jpg',
  scan: '/icons/shield-scan.jpg',
  download: '/icons/shield-download.jpg',
  panic: '/icons/shield-panic.jpg',
};

export default function ShieldPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <BackLink label="Back" />

        <div className="mt-8 flex flex-col sm:flex-row gap-8 items-start">
          <img
            src={ICONS.mark}
            alt="Shield"
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover border border-cyan-400/30"
          />
          <div>
            <p className="text-[11px] tracking-[0.28em] text-cyan-300 font-bold">FUTURET3CH PRODUCT</p>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-2">Shield</h1>
            <p className="mt-4 text-sm sm:text-base opacity-80 max-w-2xl leading-relaxed">
              Live grid and live tracking on this device. For everyone. Safety design starts with people in
              stalking situations — especially women and kids with a <strong>visible</strong> guardian link.
              We do not fake scans. We do not hack back.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="https://memetorrent.futuret3ch.com.au/shield"
                className="px-4 py-2 rounded-full bg-cyan-400 text-black font-semibold text-sm"
              >
                memetorrent.futuret3ch.com.au/shield
              </a>
              <Link
                href="/login?next=/shield/trial&from=shield-trial"
                className="px-4 py-2 rounded-full border border-white/20 text-sm"
              >
                Start 14-day trial
              </Link>
            </div>
          </div>
        </div>

        <h2 className="mt-16 text-xs tracking-[0.2em] uppercase opacity-50">Core — not add-ons</h2>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <Card icon={ICONS.grid} title="Live grid" body="Who is actually on this hotspot. utun and awdl are this computer, not extra phones. Real data only." />
          <Card icon={ICONS.map} title="Live tracking map" body="Click a dot, then Street — that pin, not yours. City from IP geo, not GPS on a person." />
          <Card icon={ICONS.guide} title="Guide AI" body="Explains this device at your threat level. Refuses attack advice." />
          <Card icon={ICONS.panic} title="Panic lock" body="Sharing, AirDrop, odd listeners off. This device only." />
        </div>

        <h2 id="pricing" className="mt-16 scroll-mt-28 text-xs tracking-[0.2em] uppercase opacity-50">Personal pricing</h2>
        <div className="mt-4 grid sm:grid-cols-3 gap-4">
          <Card title="Free" body="Real dashboard. Masked live grid/map. 1 scan/day. Nothing invented." />
          <Card title="14-day trial" body="Full Pro plus all five add-ons. The clock is the real remaining days." />
          <Card title="Pro · $30 / mo" body="or $250 / year. Live grid and live tracking included." />
        </div>

        <h2 id="business" className="mt-16 scroll-mt-28 text-xs tracking-[0.2em] uppercase opacity-50">
          Shield Business
        </h2>
        <p className="mt-3 text-sm opacity-80 max-w-2xl leading-relaxed">
          For shops, offices, and sites with <strong>major network issues</strong>: unknown devices on Wi-Fi,
          proxy/DNS hijacks, open shares, rogue listeners. Not a fake scanner. Live grid and live tracking
          plus a business desk of network tools. Significantly higher than Personal — you buy a pack of
          licenses, or just <strong>1 seat</strong>, then add seats. Need a deal? Talk to sales.
        </p>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <Card title="1 seat · $149 / mo" body="or $1,490 / year. One licensed device. All Business network tools." />
          <Card title="10 seats · $990 / mo" body="or $9,900 / year. Extra seat $149 / mo. Better per-seat than buying one." />
          <Card title="25 seats · $1,990 / mo" body="or $19,900 / year. Extra seat $99 / mo. For a floor or small org." />
          <Card title="Talk to sales" body="Volume, education, or a site license: sales@futuret3ch.com.au — we will cut a deal if it is needed." />
        </div>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <Card icon={ICONS.grid} title="Site grid" body="Every LAN neighbor, unknown MACs, hotspot clients. Real ARP/NDP — not invented devices." />
          <Card icon={ICONS.map} title="Path & hijack tools" body="Default route, DNS, proxies, certificates, odd listeners. Built for broken or hostile office networks." />
          <Card icon={ICONS.panic} title="Site lock" body="Sharing / VNC / SMB off on this device. Panic lock. No silent remote control of staff." />
          <Card icon={ICONS.guide} title="Business Guide" body="Same AI, business playbooks: rogue Wi-Fi, extra laptops, DNS that is not yours." />
        </div>
        <Link
          href="/shield/business"
          className="inline-block mt-6 px-4 py-2 rounded-full border border-cyan-400/40 text-cyan-300 text-sm font-semibold"
        >
          Business tools & seats →
        </Link>

        <h2 id="addons" className="mt-16 text-xs tracking-[0.2em] uppercase opacity-50">Add-ons</h2>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <Card icon={ICONS.scan} title="Realtime AV · $8/mo" body="Real ClamAV on Mac/Windows. iPhone is a companion — no fake full-disk scan." />
          <Card title="Network Ops · $8/mo" body="Extra intercept. Grid and map are already in Pro." />
          <Card icon={ICONS.family} title="Family Link · $8/mo" body="Visible kid link, parental controls. Location share off by default. Child can unlink." />
          <Card title="Breach Watch · $5/mo" body="Email/phone breach alerts." />
          <Card title="Concierge · $10/mo" body="Consented remote help. No silent takeover." />
        </div>

        <h2 id="downloads" className="mt-16 text-xs tracking-[0.2em] uppercase opacity-50">Downloads</h2>
        <p className="mt-3 text-sm opacity-70">Mac is live on the Shield app. Windows, iPhone, Android, and the browser extension share the same account when published.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Pill icon={ICONS.download} label="Mac" />
          <Pill icon={ICONS.download} label="Windows" />
          <Pill icon={ICONS.download} label="iPhone companion" />
          <Pill icon={ICONS.download} label="Android" />
          <Pill icon={ICONS.download} label="Browser extension" />
        </div>

        <h2 id="docs" className="mt-16 scroll-mt-28 text-xs tracking-[0.2em] uppercase opacity-50">
          Help guides · {SHIELD_ARTICLES.length} articles
        </h2>
        <p className="mt-3 text-sm opacity-70">
          Same set that runs on the Mac Shield app.{' '}
          <Link href="/shield/help" className="text-cyan-300">
            Open searchable help center →
          </Link>
        </p>
        <div className="mt-6 space-y-8">
          {articlesByGroup().map((g) => (
            <section key={g.group}>
              <h3 className="text-sm font-semibold text-cyan-300/90 mb-2">{g.group}</h3>
              <ul className="grid sm:grid-cols-2 gap-1.5">
                {g.items.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/shield/help/${a.id}`}
                      className="block text-sm opacity-80 hover:opacity-100 hover:text-cyan-300 py-0.5"
                    >
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <a className="text-cyan-300 hover:underline" href="mailto:support@futuret3ch.com.au">
            support@futuret3ch.com.au
          </a>
          <a className="text-cyan-300 hover:underline" href="mailto:safety@futuret3ch.com.au">
            safety@futuret3ch.com.au
          </a>
          <a className="text-cyan-300 hover:underline" href="mailto:sales@futuret3ch.com.au">
            sales@futuret3ch.com.au
          </a>
        </div>
        <p className="mt-2 text-xs opacity-50">
          Shield never uses support@memetorrent.com.au. Product and safety mail is Futuret3ch only.
        </p>

        <h2 id="api" className="mt-16 scroll-mt-28 text-xs tracking-[0.2em] uppercase opacity-50">
          API
        </h2>
        <p className="mt-3 text-sm opacity-80">
          Full endpoint list:{' '}
          <Link className="text-cyan-300 break-all" href="/shield/api">
            /shield/api
          </Link>
          {' · '}
          <Link className="text-cyan-300" href="/shield/help">
            {SHIELD_ARTICLES.length} help guides
          </Link>
        </p>
        <p className="mt-2 text-sm opacity-70">
          Auth, licenses, devices, scans, Guide, Family Link. Head Office is staff-only
          (same Futuret3ch ops desk — not a public hostname).
        </p>
        <p className="mt-2 text-sm opacity-70">
          Wallet:{' '}
          <a className="text-cyan-300" href="https://mt.futuret3ch.com.au/">
            https://mt.futuret3ch.com.au
          </a>
        </p>

        <h2 id="billing" className="mt-16 scroll-mt-28 text-xs tracking-[0.2em] uppercase opacity-50">
          Billing
        </h2>
        <p className="mt-3 text-sm opacity-80 max-w-2xl leading-relaxed">
          Prices above are what you will pay. Checkout is not live yet.
        </p>
        <ul className="mt-4 space-y-2 text-sm opacity-80">
          <li>
            <strong>PayID</strong> — available for Shield billing (email{' '}
            <a className="text-cyan-300" href="mailto:sales@futuret3ch.com.au">
              sales@futuret3ch.com.au
            </a>{' '}
            or{' '}
            <a className="text-cyan-300" href="mailto:support@futuret3ch.com.au">
              support@futuret3ch.com.au
            </a>
            ).
          </li>
          <li>
            <strong>Credit cards</strong> — coming soon.
          </li>
          <li>
            <strong>Send</strong> — coming soon.
          </li>
          <li>
            <strong>All other billing</strong> — coming soon.
          </li>
        </ul>
        <p className="mt-3 text-sm opacity-70">
          Personal Pro $30 / mo or $250 / year. Business 1 / 10 / 25 seats as listed. Need a deal? Talk to
          sales.
        </p>
        <Link
          href="/login"
          className="inline-block mt-4 px-4 py-2 rounded-full bg-emerald-400 text-black font-semibold text-sm"
        >
          Login / Register
        </Link>

        <p className="mt-16 text-xs opacity-40">
          Shield is a Futuret3ch product on the MemeTorrent media site. We do not attack people.
        </p>
      </div>
    </main>
  );
}

function Card({
  icon,
  title,
  body,
}: {
  icon?: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="font-semibold flex items-center gap-3">
        {icon ? <img src={icon} alt="" className="w-10 h-10 rounded-xl object-cover" /> : null}
        {title}
      </h3>
      <p className="mt-2 text-sm opacity-70 leading-relaxed">{body}</p>
    </div>
  );
}

function Pill({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-white/15 text-sm">
      <img src={icon} alt="" className="w-6 h-6 rounded-md object-cover" />
      {label}
    </span>
  );
}
