'use client';

import { useEffect, useState } from 'react';
import Footer from '@/components/footer/Footer';
import Navbar from '@/components/nav/Navbar';
import GameWalletBridge from '@/components/wallet/GameWalletBridge';

/** Hide nav/footer in iframes and on /play so games get the full screen. */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const [framed, setFramed] = useState(false);
  const [play, setPlay] = useState(false);
  useEffect(() => {
    const inFrame = window.self !== window.top;
    const onPlay = location.pathname.startsWith('/play/');
    setFramed(inFrame);
    setPlay(onPlay);
    if (inFrame) document.documentElement.classList.add('mt-embed');
    else document.documentElement.classList.remove('mt-embed');
  }, []);

  if (framed || play) {
    return <main className="min-h-0 h-dvh overflow-hidden">{children}</main>;
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
