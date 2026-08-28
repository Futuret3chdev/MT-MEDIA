'use client';

import { useMemo, useState } from 'react';
import type { ShieldArticle } from '@/lib/shieldHelp';

export default function HelpIndex({ articles }: { articles: ShieldArticle[] }) {
  const [q, setQ] = useState('');
  const grouped = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const order: string[] = [];
    const map = new Map<string, ShieldArticle[]>();
    for (const a of articles) {
      if (
        needle &&
        !`${a.title} ${a.group} ${a.body}`.toLowerCase().includes(needle)
      ) {
        continue;
      }
      if (!map.has(a.group)) {
        map.set(a.group, []);
        order.push(a.group);
      }
      map.get(a.group)!.push(a);
    }
    return order.map((group) => ({ group, items: map.get(group)! }));
  }, [articles, q]);

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={`Search ${articles.length} guides…`}
        className="w-full mb-8 px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm"
      />
      {grouped.map((g) => (
        <section key={g.group} className="mb-10">
          <h2 className="text-xs tracking-[0.2em] uppercase opacity-50 mb-3">{g.group}</h2>
          <ul className="grid sm:grid-cols-2 gap-2">
            {g.items.map((a) => (
              <li key={a.id}>
                <a
                  href={`/shield/help/${a.id}`}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] px-2 py-2 text-sm"
                >
                  {a.image ? (
                    <img src={a.image} alt="" className="w-16 h-10 rounded-lg object-cover shrink-0" />
                  ) : null}
                  <span>{a.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {!grouped.length && <p className="text-sm opacity-60">No guides match that search.</p>}
    </div>
  );
}
