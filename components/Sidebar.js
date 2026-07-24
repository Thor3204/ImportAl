'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

const LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: '\u25A6' },
  { href: '/search', label: 'Buscador de productos', icon: '\u2315' },
  { href: '/chat', label: 'Chat IA', icon: '\u2726' },
  { href: '/orders', label: 'Mis importaciones', icon: '\u2691' },
  { href: '/admin', label: 'Admin', icon: '\u2699' }
];

export default function Sidebar({ userEmail }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-panel flex flex-col min-h-screen">
      <div className="px-5 py-6">
        <div className="text-lg font-bold tracking-tight">Import <span className="text-accent">AI</span></div>
        <div className="text-xs text-white/40 mt-1">Centro inteligente de importaciones</div>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-accent/15 text-accent' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="w-4 text-center">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-border">
        <div className="text-xs text-white/40 truncate mb-2">{userEmail}</div>
        <button onClick={handleSignOut} className="text-xs text-white/60 hover:text-white">
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
