'use client';

import { useEffect } from 'react';

/** Sticky header eats hash targets unless we scroll them into view. */
export default function HashScroll() {
  useEffect(() => {
    const go = () => {
      const id = window.location.hash.replace('#', '');
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: y, behavior: 'smooth' });
    };
    const t = window.setTimeout(go, 50);
    window.addEventListener('hashchange', go);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('hashchange', go);
    };
  }, []);
  return null;
}
