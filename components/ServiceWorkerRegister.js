'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // registro silencioso: si falla, la app sigue funcionando como web normal
      });
    }
  }, []);

  return null;
}
