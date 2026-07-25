'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import AppShell from '../../components/AppShell';
import { supabase } from '../../lib/supabaseClient';

const STATUS_FLOW = [
  'found',
  'supplier_analyzed',
  'cost_calculated',
  'purchased',
  'shipped',
  'in_customs',
  'received',
  'stocked',
  'sold'
];

function NewOrderForm({ userId, onCreated }) {
  const [productName, setProductName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourcePlatform, setSourcePlatform] = useState('aliexpress');
  const [unitCost, setUnitCost] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!productName.trim()) return;
    setSaving(true);
    setError(null);
    const { data, error: insertError } = await supabase
      .from('import_orders')
      .insert({
        requested_by: userId,
        product_name: productName,
        source_url: sourceUrl || null,
        source_platform: sourcePlatform,
        unit_cost: unitCost ? Number(unitCost) : null,
        quantity: Number(quantity) || 1,
        status: 'found'
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
    } else {
      await supabase.from('import_order_events').insert({
        import_order_id: data.id,
        status: 'found',
        note: 'Orden creada desde el frontend',
        created_by: userId
      });
      setProductName('');
      setSourceUrl('');
      setUnitCost('');
      setQuantity(1);
      onCreated();
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-3">
      <h2 className="font-semibold">Nueva importación</h2>
      <input className="input" placeholder="Nombre del producto" value={productName} onChange={(e) => setProductName(e.target.value)} required />
      <input className="input" placeholder="URL del proveedor (opcional)" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select className="input" value={sourcePlatform} onChange={(e) => setSourcePlatform(e.target.value)}>
          <option value="aliexpress">AliExpress</option>
          <option value="1688">1688</option>
          <option value="taobao">Taobao</option>
          <option value="shein">SHEIN</option>
          <option value="otro">Otro</option>
        </select>
        <input className="input" type="number" step="0.01" placeholder="Costo unitario" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
        <input className="input" type="number" min="1" placeholder="Cantidad" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button className="btn-primary" type="submit" disabled={saving}>
        {saving ? 'Guardando…' : 'Crear orden'}
      </button>
    </form>
  );
}

function OrdersBody({ session }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [events, setEvents] = useState([]);

  async function loadOrders() {
    setLoading(true);
    const { data } = await supabase
      .from('import_orders')
      .select('*')
      .eq('requested_by', session.user.id)
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleExpand(orderId) {
    if (expanded === orderId) {
      setExpanded(null);
      return;
    }
    const { data } = await supabase
      .from('import_order_events')
      .select('*')
      .eq('import_order_id', orderId)
      .order('created_at', { ascending: true });
    setEvents(data || []);
    setExpanded(orderId);
  }

  return (
    <div className="flex-1 p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-1">Mis importaciones</h1>
      <p className="text-white/40 text-sm mb-6">Datos reales de la tabla <code>import_orders</code> (RLS: solo ves las tuyas).</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <NewOrderForm userId={session.user.id} onCreated={loadOrders} />
        </div>

        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <p className="text-white/40">Cargando…</p>
          ) : orders.length === 0 ? (
            <p className="text-white/40 text-sm">Todavía no tienes órdenes. Crea la primera con el formulario.</p>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="card p-4">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(o.id)}>
                  <div>
                    <div className="font-medium">{o.product_name}</div>
                    <div className="text-xs text-white/40">{o.source_platform} · {o.quantity} u.</div>
                  </div>
                  <span className="badge bg-accent/15 text-accent">{o.status}</span>
                </div>

                {expanded === o.id && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {STATUS_FLOW.map((s) => (
                        <span
                          key={s}
                          className={`badge ${
                            STATUS_FLOW.indexOf(o.status) >= STATUS_FLOW.indexOf(s)
                              ? 'bg-accent2/20 text-accent2'
                              : 'bg-white/5 text-white/30'
                          }`}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    {events.length === 0 ? (
                      <p className="text-white/40 text-xs">Sin eventos registrados.</p>
                    ) : (
                      <ul className="space-y-1">
                        {events.map((ev) => (
                          <li key={ev.id} className="text-xs text-white/50">
                            {new Date(ev.created_at).toLocaleString()} — {ev.status} {ev.note ? `(${ev.note})` : ''}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <AuthGuard>
      {(session) => (
        <AppShell userEmail={session.user.email}>
          <OrdersBody session={session} />
        </AppShell>
      )}
    </AuthGuard>
  );
}
