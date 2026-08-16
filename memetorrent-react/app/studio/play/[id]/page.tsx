'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import GameRuntime from '@/components/studio/GameRuntime';
import { defaultSpec, type StudioSpec } from '@/lib/studio-spec';

export default function StudioPlayPage() {
  const params = useParams<{ id: string }>();
  const [spec, setSpec] = useState<StudioSpec | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch(`/api/studio/titles/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) {
          setErr(d.error || 'Not found');
          return;
        }
        const cfg = d.title?.config;
        if (cfg && cfg.template) setSpec(cfg);
        else setSpec({ ...defaultSpec('tap'), name: d.title?.name || 'Game' });
      })
      .catch(() => setErr('Could not load'));
  }, [params.id]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link href="/studio" className="text-sm opacity-70">← Studio</Link>
      <h1 className="text-3xl font-semibold mt-3 mb-4">{spec?.name || 'Loading…'}</h1>
      {err && <p className="text-red-400 text-sm">{err}</p>}
      {spec && <GameRuntime spec={spec} />}
    </div>
  );
}
