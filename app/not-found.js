'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="text-5xl font-bold mb-2">404</div>
      <p className="text-white/50 mb-6">Esta página no existe en Import AI.</p>
      <Link href="/dashboard" className="btn-primary">
        Volver al dashboard
      </Link>
    </div>
  );
}
