'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import Sidebar from '../../components/Sidebar';
import { supabase } from '../../lib/supabaseClient';

function AdminBody({ session }) {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectors, setConnectors] = useState([]);
  const [usersCount, setUsersCount] = useState(null);
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: me } = await supabase.from('users').select('role').eq('id', session.user.id).maybeSingle();
      if (!active) return;
      const userRole = me?.role || 'customer';
      setRole(userRole);

      if (userRole === 'admin' || userRole === 'super_admin') {
        const [{ data: conn }, { count }, { data: snap }] = await Promise.all([
          supabase.from('api_connectors').select('*').order('created_at', { ascending: false }),
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('system_snapshots').select('*').order('taken_at', { ascending: false }).limit(1).maybeSingle()
        ]);
        if (!active) return;
        setConnectors(conn || []);
        setUsersCount(count);
        setSnapshot(snap);
      }
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [session.user.id]);

  if (loading) return <div className="flex-1 p-8 text-white/40">Cargando…</div>;

  if (role !== 'admin' && role !== 'super_admin') {
    return (
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-2">Admin</h1>
        <p className="text-white/40">Tu rol actual (<code>{role}</code>) no tiene acceso al panel de administración.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      <h1 className="text-2xl font-bold mb-1">Panel de administración</h1>
      <p className="text-white/40 text-sm mb-6">Vista de solo lectura sobre usuarios, conectores y salud del sistema.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <div className="text-xs text-white/40 uppercase">Usuarios</div>
          <div className="text-2xl font-bold mt-2">{usersCount ?? '—'}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-white/40 uppercase">Conectores activos</div>
          <div className="text-2xl font-bold mt-2">{connectors.filter((c) => c.status === 'active').length}/{connectors.length}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-white/40 uppercase">Último snapshot</div>
          <div className="text-sm mt-2 text-white/60">{snapshot ? new Date(snapshot.taken_at).toLocaleString() : 'Sin datos aún'}</div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-3">Conectores (api_connectors)</h2>
        {connectors.length === 0 ? (
          <p className="text-white/40 text-sm">
            No hay conectores configurados todavía. Necesitas insertar un registro tipo <code>RAPIDAPI</code> con tu API key en{' '}
            <code>api_connectors</code> / <code>api_credentials</code> para que el buscador y el chat puedan traer productos reales.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-white/40 text-left">
              <tr>
                <th className="pb-2">Nombre</th>
                <th className="pb-2">Tipo</th>
                <th className="pb-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {connectors.map((c) => (
                <tr key={c.id} className="border-t border-border/60">
                  <td className="py-2">{c.name}</td>
                  <td className="py-2">{c.type}</td>
                  <td className="py-2">
                    <span className={`badge ${c.status === 'active' ? 'bg-accent2/20 text-accent2' : 'bg-white/10 text-white/40'}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthGuard>
      {(session) => (
        <div className="flex">
          <Sidebar userEmail={session.user.email} />
          <AdminBody session={session} />
        </div>
      )}
    </AuthGuard>
  );
}
