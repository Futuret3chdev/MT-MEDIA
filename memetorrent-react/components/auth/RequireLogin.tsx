'use client';

import { useEffect, useState } from 'react';

export default function RequireLogin({
  next,
  children,
}: {
  next: string;
  children: React.ReactNode;
}) {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    fetch('/api/portal/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setOk(true);
        else window.location.replace(`/login?next=${encodeURIComponent(next)}`);
      })
      .catch(() => window.location.replace(`/login?next=${encodeURIComponent(next)}`));
  }, [next]);
  if (!ok) return <div className="px-4 py-20 text-sm opacity-60">Checking account…</div>;
  return <>{children}</>;
}
