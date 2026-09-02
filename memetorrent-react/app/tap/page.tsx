'use client';

import { useEffect } from 'react';

export default function TapPage() {
  useEffect(() => {
    window.location.replace('/play/tap');
  }, []);
  return null;
}
