'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import AppShell from '../../components/AppShell';
import { supabase } from '../../lib/supabaseClient';

function StatCard({ label, value, sub }) {
  return (
    <div className="card p-5">
      <div className="text-xs text-white/40 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold mt-2">{value}</div>
      {sub && <div className="text-xs text-white/40 mt-1">{sub}</div>}
    </div>
  );
}

function DashboardBody({ session }) {
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [aiLimits, setAiLimits] = useState(null);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    let active = true;
    const userId = session.user.id;

    async function load() {
      setLoading(true);
      const [walletRes, limitsRes, ordersRes, notifRes] = await Promise.all([
        supabase.from('wallets').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('user_ai_limits').select('*').eq('user_id', userId).maybeSingle(),
        supabase
          .from('import_orders')
          .select('id, product_name, status, total_cost, currency, created_at')
          .eq('requested_by', userId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('notifications')
          .select('id, title, body, type, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      if (!active) return;

      if (walletRes.error && walletRes.error.code !== 'PGRST116') setErrorMsg(walletRes.error.message);
      setWallet(walletRes.data);
      setAiLimits(limitsRes.data);
      setOrders(ordersRes.data || []);
      setNotifications(notifRes.data || []);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [session.user.id]);

  return (
    <div className="flex-1 p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-white/40 text-sm mb-6">Resumen de tu cuenta en Import AI, conectado en vivo a Supabase.</p>

      {loading ? (
        <p className="text-white/40">Cargando datos reales del backend…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Saldo"
              value={wallet ? `${wallet.balance} ${wallet.currency}` : 'Sin wallet aún'}
            />
            <StatCard
              label="Tokens IA hoy"
              value={aiLimits ? `${aiLimits.daily_tokens_used}/${aiLimits.daily_token_limit}` : '—'}
            />
            <StatCard
              label="Costo IA (mes)"
              value={aiLimits ? `$${aiLimits.monthly_cost_used}/$${aiLimits.monthly_cost_limit}` : '—'}
            />
            <StatCard label="Importaciones activas" value={orders.length} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h2 className="font-semibold mb-3">Últimas importaciones</h2>
              {orders.length === 0 ? (
                <p className="text-white/40 text-sm">Aún no tienes órdenes de importación. Créalas desde “Mis importaciones”.</p>
              ) : (
                <ul className="space-y-2">
                  {orders.map((o) => (
                    <li key={o.id} className="flex items-center justify-between text-sm border-b border-border/60 pb-2">
                      <span>{o.product_name}</span>
                      <span className="badge bg-accent/15 text-accent">{o.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card p-5">
              <h2 className="font-semibold mb-3">Notificaciones</h2>
              {notifications.length === 0 ? (
                <p className="text-white/40 text-sm">No tienes notificaciones todavía.</p>
              ) : (
                <ul className="space-y-2">
                  {notifications.map((n) => (
                    <li key={n.id} className="text-sm border-b border-border/60 pb-2">
                      <div className="font-medium">{n.title}</div>
                      {n.body && <div className="text-white/40 text-xs mt-0.5">{n.body}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {errorMsg && <p className="text-red-400 text-sm mt-4">{errorMsg}</p>}
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      {(session) => (
        <AppShell userEmail={session.user.email}>
          <DashboardBody session={session} />
        </AppShell>
      )}
    </AuthGuard>
  );
}
