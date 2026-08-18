import './globals.css';
import Navbar from '@/components/nav/Navbar';
import Footer from '@/components/footer/Footer';
import { WalletAdapterProvider } from '@/components/wallet/WalletAdapterProvider';
import MtTracker from '@/components/analytics/MtTracker';

export const metadata = {
  title: 'MT-ECO SYSTEM | $MT • INFINITE WALLET • 1¢ Fees — by Futuret3ch and MemeTorrent',
  description: 'Next-generation decentralized on-chain network. Native $MT token. Self-built INFINITE WALLET. NFTs, Rockets, self-built bridges. No third parties. Infinite possibilities.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-build="2026-08-18-clubpool-table">
      <head>
        {/* Font Awesome for social icons in original brand colors */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
          crossOrigin="anonymous" 
        />
      </head>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <WalletAdapterProvider>
          <MtTracker />
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </WalletAdapterProvider>
      </body>
    </html>
  );
}
