'use client';

import { useEffect } from 'react';

export default function PlayRedirect({ id }: { id: string }) {
  useEffect(() => {
    window.location.replace(`/play/${id}`);
  }, [id]);
  return null;
}
