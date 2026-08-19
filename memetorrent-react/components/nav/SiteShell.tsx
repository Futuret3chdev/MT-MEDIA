'use client';

import { useEffect, useState } from 'react';
import Footer from '@/components/footer/Footer';
import Navbar from '@/components/nav/Navbar';
import GameWalletBridge from '@/components/wallet/GameWalletBridge';

/** Hide nav/footer when this page is inside an iframe so chrome is not stacked. */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const [framed, setFramed] = useState(false);
  useEffect(() => {
    setFramed(window.self !== window.top);
  }, []);

  if (framed) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <GameWalletBridge />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
