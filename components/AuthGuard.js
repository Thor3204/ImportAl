'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState('checking');
  const [session, setSession] = useState(null);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) {
        router.replace('/login');
        setStatus('unauthenticated');
      } else {
        setSession(data.session);
        setStatus('authenticated');
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!newSession) {
        router.replace('/login');
        setStatus('unauthenticated');
      } else {
        setSession(newSession);
        setStatus('authenticated');
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50">Verificando sesión…</p>
      </div>
    );
  }

  return children(session);
}
