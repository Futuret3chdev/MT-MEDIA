import type { Metadata } from 'next';
import BackLink from '../BackLink';

export const metadata: Metadata = {
  title: 'Shield Business · Futuret3ch',
  description:
    'Shield Business: live grid and network tools for offices with major network issues. 1 seat or license packs. Talk to sales for a deal.',
};

export default function ShieldBusinessPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <BackLink label="Back" />
        <p className="text-[11px] tracking-[0.28em] text-cyan-300 font-bold mt-8">SHIELD BUSINESS</p>
        <h1 className="text-4xl font-semibold tracking-tight mt-2">Network tools for a broken office LAN</h1>
        <p className="mt-4 text-sm opacity-80 max-w-2xl leading-relaxed">
          Personal Shield is one person, one device. Business is for sites that already have unknown laptops
          on Wi-Fi, weird DNS, open shares, or a floor full of hotspots. Tools are real (ARP, NDP, DNS,
          proxies, listeners). We do not hack other companies. We do not fake a full-disk scan.
        </p>

        <h2 className="mt-12 text-xs tracking-[0.2em] uppercase opacity-50">Seats</h2>
        <ul className="mt-3 space-y-2 text-sm opacity-80">
          <li>
            <strong>1 seat</strong> — $149 / mo or $1,490 / year.
          </li>
          <li>
            <strong>10 seats</strong> — $990 / mo or $9,900 / year. Extra seat $149 / mo.
          </li>
          <li>
            <strong>25 seats</strong> — $1,990 / mo or $19,900 / year. Extra seat $99 / mo.
          </li>
          <li>
            Need a different count or a non-profit/education cut?{' '}
            <a className="text-cyan-300" href="mailto:sales@futuret3ch.com.au">
              sales@futuret3ch.com.au
            </a>{' '}
            — volume and education quotes.
          </li>
        </ul>

        <h2 className="mt-12 text-xs tracking-[0.2em] uppercase opacity-50">Tools included</h2>
        <ul className="mt-3 space-y-2 text-sm opacity-80">
          <li>Site grid — every neighbor on this LAN, unknown MACs flagged.</li>
          <li>Path health — gateway, default route, Wi-Fi SSID, Apple utun labeled as this Mac not extra phones.</li>
          <li>Hijack watch — DNS, HTTP/HTTPS/SOCKS proxy, unexpected certificates.</li>
          <li>Listener audit — SSH/SMB/VNC/odd ports on this device.</li>
          <li>Site lock / panic lock — sharing and AirDrop off. No silent staff remote-control.</li>
          <li>Incident export — a real report from this device for IT or police.</li>
        </ul>

        <h2 id="billing" className="mt-12 text-xs tracking-[0.2em] uppercase opacity-50">
          Billing
        </h2>
        <ul className="mt-3 space-y-2 text-sm opacity-80">
          <li>
            <strong>PayID</strong> — available. Email sales@futuret3ch.com.au or support@futuret3ch.com.au.
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

        <h2 id="contact" className="mt-12 text-xs tracking-[0.2em] uppercase opacity-50">
          Contact (Futuret3ch only)
        </h2>
        <p className="mt-3 text-sm opacity-80">
          Product help:{' '}
          <a className="text-cyan-300" href="mailto:support@futuret3ch.com.au">
            support@futuret3ch.com.au
          </a>
        </p>
        <p className="mt-2 text-sm opacity-80">
          Stalking / safety:{' '}
          <a className="text-cyan-300" href="mailto:safety@futuret3ch.com.au">
            safety@futuret3ch.com.au
          </a>
        </p>
        <p className="mt-2 text-sm opacity-80">
          Business deals:{' '}
          <a className="text-cyan-300" href="mailto:sales@futuret3ch.com.au">
            sales@futuret3ch.com.au
          </a>
        </p>

      </div>
    </main>
  );
}
