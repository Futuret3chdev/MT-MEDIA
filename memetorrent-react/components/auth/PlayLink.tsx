'use client';

import { useEffect, useState } from 'react';

export default function PlayLink({
  href,
  children,
  className,
  external,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    fetch('/api/portal/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setAuthed(!!d.user))
      .catch(() => setAuthed(false));
  }, []);
  const dest = authed ? href : `/login?next=${encodeURIComponent(href)}`;
  return (
    <a
      href={dest}
      target={authed && external ? '_blank' : undefined}
      rel={authed && external ? 'noopener noreferrer' : undefined}
      className={className}
    >
      {children}
    </a>
  );
}
