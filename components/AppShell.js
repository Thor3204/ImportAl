'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const LINKS = [
  { href: '/dashboard', label: 'Inicio', icon: HomeIcon },
  { href: '/search', label: 'Buscar', icon: SearchIcon },
  { href: '/chat', label: 'Chat IA', icon: SparkIcon },
  { href: '/orders', label: 'Pedidos', icon: BoxIcon },
  { href: '/admin', label: 'Perfil', icon: GearIcon }
];

function HomeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function SearchIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}
function SparkIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function BoxIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 8 12 3 3 8l9 5 9-5Z" strokeLinejoin="round" />
      <path d="M3 8v9l9 5 9-5V8" strokeLinejoin="round" />
      <path d="M12 13v9" />
    </svg>
  );
}
function GearIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 13a7.7 7.7 0 0 0 0-2l2-1.5-2-3.4-2.3.9a7.6 7.6 0 0 0-1.8-1l-.4-2.5H9.1l-.4 2.5a7.6 7.6 0 0 0-1.8 1l-2.3-.9-2 3.4L4.6 11a7.7 7.7 0 0 0 0 2l-2 1.6 2 3.4 2.3-.9c.55.44 1.16.78 1.8 1l.4 2.5h4.9l.4-2.5c.64-.22 1.25-.56 1.8-1l2.3.9 2-3.4-2-1.6Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AppShell({ userEmail, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem('importai:sidebar-collapsed');
    if (saved === '1') setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem('importai:sidebar-collapsed', next ? '1' : '0');
      return next;
    });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — desktop */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-border bg-panel min-h-screen sticky top-0 transition-all duration-200 ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        <div className="px-5 py-6 flex items-center justify-between">
          {!collapsed && (
            <div>
              <div className="text-lg font-bold tracking-tight">
                Import <span className="text-accent">AI</span>
              </div>
              <div className="text-xs text-white/40 mt-1">Centro de importaciones</div>
            </div>
          )}
          <button
            onClick={toggleCollapsed}
            className="w-7 h-7 shrink-0 rounded-md flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5"
            aria-label="Colapsar menú"
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                title={collapsed ? link.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? 'bg-accent/15 text-accent' : 'text-white/60 hover:text-white hover:bg-white/5'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {!collapsed && link.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-border">
          {!collapsed && <div className="text-xs text-white/40 truncate mb-2">{userEmail}</div>}
          <button
            onClick={handleSignOut}
            className={`text-xs text-white/60 hover:text-white ${collapsed ? 'w-full text-center' : ''}`}
          >
            {collapsed ? '⏻' : 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <div className="flex-1 min-h-screen pb-[76px] md:pb-0">{children}</div>

      {/* Bottom nav — móvil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-panel/90 backdrop-blur-lg border-t border-border pb-safe">
        <div className="flex items-stretch justify-between px-2">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium ${
                  active ? 'text-accent' : 'text-white/45'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
