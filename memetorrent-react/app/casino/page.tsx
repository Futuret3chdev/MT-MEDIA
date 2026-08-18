'use client';

import { useEffect } from 'react';

/** 18+ floor keeps the site nav + footer; lobby sits in the page body. */
export default function CasinoPage() {
  useEffect(() => {
    document.documentElement.classList.add('casino-shell');
    return () => document.documentElement.classList.remove('casino-shell');
  }, []);

  return (
    <iframe
      src="/casino-floor/index.html"
      title="Nova Mirage — 18+"
      className="block w-full h-full min-h-[70dvh] flex-1 border-0 bg-[#0d1117]"
      allow="clipboard-write; fullscreen"
    />
  );
}
