'use client';

import { usePathname } from 'next/navigation';
import { PRODUCT_TABS, tabFromPath } from '@/lib/productTabs';

export default function ProductTabBar() {
  const path = usePathname() || '/';
  const active = tabFromPath(path);
  return (
    <div className="border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto">
        {PRODUCT_TABS.map((t) => {
          const on = active === t.id;
          const external = t.href.startsWith('http');
          return (
            <a
              key={t.id}
              href={t.href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener' : undefined}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold tracking-wide border ${
                on
                  ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-200'
                  : 'border-white/10 opacity-70 hover:opacity-100'
              }`}
            >
              {t.id === 'shield' ? (
                <span className="inline-flex items-center gap-1.5">
                  <img src="/icons/shield-mark.jpg" alt="" className="w-4 h-4 rounded" />
                  {t.label}
                </span>
              ) : (
                t.label
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
