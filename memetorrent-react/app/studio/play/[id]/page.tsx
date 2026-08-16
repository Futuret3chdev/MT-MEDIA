'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PlatformPlay from '@/components/studio/PlatformPlay';
import GameRuntime from '@/components/studio/GameRuntime';
import { blankMap, type MapSpec } from '@/lib/studio-map';
import type { StudioSpec } from '@/lib/studio-spec';
import RequireLogin from '@/components/auth/RequireLogin';

export default function StudioPlayPage() {
  const params = useParams<{ id: string }>();
  return (
    <RequireLogin next={`/studio/play/${params.id}`}>
      <PlayInner />
    </RequireLogin>
  );
}

function PlayInner() {
  const params = useParams<{ id: string }>();
  const [map, setMap] = useState<MapSpec | null>(null);
  const [kit, setKit] = useState<StudioSpec | null>(null);
  const [name, setName] = useState('Game');
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch(`/api/studio/titles/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) {
          setErr(d.error || 'Not found');
          return;
        }
        setName(d.title?.name || 'Game');
        const cfg = d.title?.config;
        if (cfg?.type === 'platformer' && Array.isArray(cfg.tiles)) setMap(cfg);
        else if (cfg?.template) setKit(cfg);
        else setMap(blankMap());
      })
      .catch(() => setErr('Could not load'));
  }, [params.id]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex flex-wrap gap-4 text-sm mb-2">
        <Link href="/" className="opacity-70">← Home</Link>
        <Link href="/studio" className="opacity-70">← Studio</Link>
        <Link href="/studio/editor" className="opacity-70">← Editor</Link>
      </div>
      <h1 className="text-3xl font-semibold mt-3 mb-4">{name}</h1>
      {err && <p className="text-red-400 text-sm">{err}</p>}
      {map && <PlatformPlay spec={map} />}
      {kit && <GameRuntime spec={kit} />}
    </div>
  );
}
