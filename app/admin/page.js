'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import Sidebar from '../../components/Sidebar';
import { supabase } from '../../lib/supabaseClient';

const PLATFORM_PRESETS = [
  { value: 'aliexpress', label: 'AliExpress' },
  { value: '1688', label: '1688' },
  { value: 'taobao', label: 'Taobao' },
  { value: 'shein', label: 'SHEIN' }
];

function ConnectorForm({ onCreated }) {
  const [name, setName] = useState('aliexpress');
  const [host, setHost] = useState('');
  const [endpoint, setEndpoint] = useState('/search?query={query}');
  const [secretName, setSecretName] = useState('RAPIDAPI_KEY');
  const [rateLimit, setRateLimit] = useState(60);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!host.trim()) throw new Error('Falta el host (ej: alguna-api.p.rapidapi.com)');
      if (!endpoint.includes('{query}')) {
        throw new Error('El endpoint debe incluir el placeholder {query}, ej: /search?query={query}');
      }

      // 1. Conector
      const { data: connector, error: connError } = await supabase
        .from('api_connectors')
        .insert({
          name,
          provider: 'rapidapi',
          category: 'marketplace',
          type: 'RAPIDAPI',
          base_url: `https://${host.replace(/^https?:\/\//, '')}`,
          auth_type: 'rapidapi_key',
          headers: {},
          rate_limit_per_min: Number(rateLimit) || 60,
          timeout_ms: 10000,
          retries: 2,
          status: 'active'
        })
        .select()
        .single();
      if (connError) throw new Error(`api_connectors: ${connError.message}`);

      // 2. Acción de búsqueda que usa search-products
      const { error: actionError } = await supabase.from('connector_actions').insert({
        connector_id: connector.id,
        name: 'search_products',
        method: 'GET',
        endpoint,
        input_schema: { query: 'string' },
        output_schema: {},
        response_mapping: {},
        enabled: true
      });
      if (actionError) throw new Error(`connector_actions: ${actionError.message}`);

      // 3. Credencial: solo guarda el NOMBRE del secret (el valor real vive en Edge Function Secrets)
      const { error: credError } = await supabase.from('api_credentials').insert({
        integration_id: connector.id,
        secret_name: secretName,
        status: 'active'
      });
      if (credError) throw new Error(`api_credentials: ${credError.message}`);

      setSuccess(
        `Conector "${name}" creado. Prueba en /search con la plataforma "${name}". Si la respuesta viene sin mapear, se mostrará el JSON crudo de la API hasta que se agregue un mapping.`
      );
      setHost('');
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-3">
      <h2 className="font-semibold">Nuevo conector RapidAPI</h2>
      <p className="text-xs text-white/40">
        Esto solo guarda la <strong>estructura</strong> del conector (nombre, host, endpoint, nombre del secret). La API key en sí
        nunca pasa por aquí ni por el frontend: debe existir ya como secret en Supabase → Edge Functions → Secrets.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <select className="input" value={name} onChange={(e) => setName(e.target.value)}>
          {PLATFORM_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <input
          className="input"
          type="number"
          placeholder="Rate limit / min"
          value={rateLimit}
          onChange={(e) => setRateLimit(e.target.value)}
        />
      </div>

      <input
        className="input"
        placeholder="Host (ej: alguna-api.p.rapidapi.com)"
        value={host}
        onChange={(e) => setHost(e.target.value)}
        required
      />
      <input
        className="input"
        placeholder="Endpoint de búsqueda, con {query} — ej: /search?query={query}"
        value={endpoint}
        onChange={(e) => setEndpoint(e.target.value)}
        required
      />
      <input
        className="input"
        placeholder="Nombre exacto del secret en Supabase (ej: RAPIDAPI_KEY)"
        value={secretName}
        onChange={(e) => setSecretName(e.target.value)}
        required
      />

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-accent2 text-sm">{success}</p>}

      <button className="btn-primary" type="submit" disabled={saving}>
        {saving ? 'Creando…' : 'Crear conector'}
      </button>
    </form>
  );
}

function AdminBody({ session }) {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectors, setConnectors] = useState([]);
  const [usersCount, setUsersCount] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [toggling, setToggling] = useState(null);

  async function loadAdminData() {
    const [{ data: conn }, { count }, { data: snap }] = await Promise.all([
      supabase.from('api_connectors').select('*').order('created_at', { ascending: false }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('system_snapshots').select('*').order('taken_at', { ascending: false }).limit(1).maybeSingle()
    ]);
    setConnectors(conn || []);
    setUsersCount(count);
    setSnapshot(snap);
  }

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: me } = await supabase.from('users').select('role').eq('id', session.user.id).maybeSingle();
      if (!active) return;
      const userRole = me?.role || 'customer';
      setRole(userRole);

      if (userRole === 'admin' || userRole === 'super_admin') {
        await loadAdminData();
      }
      if (active) setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.user.id]);

  async function toggleConnector(connector) {
    setToggling(connector.id);
    const nextStatus = connector.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('api_connectors').update({ status: nextStatus }).eq('id', connector.id);
    if (!error) await loadAdminData();
    setToggling(null);
  }

  if (loading) return <div className="flex-1 p-8 text-white/40">Cargando…</div>;

  if (role !== 'admin' && role !== 'super_admin') {
    return (
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-2">Admin</h1>
        <p className="text-white/40">
          Tu rol actual (<code>{role}</code>) no tiene acceso al panel de administración.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      <h1 className="text-2xl font-bold mb-1">Panel de administración</h1>
      <p className="text-white/40 text-sm mb-6">Usuarios, conectores y salud del sistema — datos reales.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <div className="text-xs text-white/40 uppercase">Usuarios</div>
          <div className="text-2xl font-bold mt-2">{usersCount ?? '—'}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-white/40 uppercase">Conectores activos</div>
          <div className="text-2xl font-bold mt-2">
            {connectors.filter((c) => c.status === 'active').length}/{connectors.length}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-white/40 uppercase">Último snapshot</div>
          <div className="text-sm mt-2 text-white/60">
            {snapshot ? new Date(snapshot.taken_at).toLocaleString() : 'Sin datos aún'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConnectorForm onCreated={loadAdminData} />

        <div className="card p-5">
          <h2 className="font-semibold mb-3">Conectores (api_connectors)</h2>
          {connectors.length === 0 ? (
            <p className="text-white/40 text-sm">
              No hay conectores configurados todavía. Crea el primero con el formulario — necesitas el host y el endpoint reales de
              tu suscripción en RapidAPI, y el secret ya debe existir en Supabase → Edge Functions → Secrets.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-white/40 text-left">
                <tr>
                  <th className="pb-2">Nombre</th>
                  <th className="pb-2">Tipo</th>
                  <th className="pb-2">Estado</th>
                  <th className="pb-2" />
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
                    <td className="py-2 text-right">
                      <button
                        className="text-xs text-white/50 hover:text-white"
                        onClick={() => toggleConnector(c)}
                        disabled={toggling === c.id}
                      >
                        {c.status === 'active' ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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
