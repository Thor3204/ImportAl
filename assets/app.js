import { supabase, callEdgeFunction, IMPORT_STATUS_FLOW } from './supabase-client.js';

const root = document.getElementById('app');
let session = null;
let profile = null; // fila de public.users
let isAdmin = false;
let currentPage = 'landing';

// ---------- Utilidades ----------
function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function money(n, currency = 'USD') { return new Intl.NumberFormat('es-VE', { style: 'currency', currency }).format(n || 0); }
function toast(msg, type = 'success') {
  const stack = document.getElementById('toast-stack');
  const el = h(`<div class="toast ${type}">${msg}</div>`);
  stack.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}
function statusBadge(status) {
  const map = { active: 'teal', completed: 'teal', paid: 'teal', sold: 'teal', pending: 'amber', queued: 'amber', in_customs: 'amber', failed: 'grey', cancelled: 'grey' };
  return `<span class="badge ${map[status] || 'grey'}">${status}</span>`;
}

// ---------- Sesión ----------
async function refreshSession() {
  const { data } = await supabase.auth.getSession();
  session = data.session;
  if (session) {
    const { data: userRow, error } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle();
    if (!error) profile = userRow;
    isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  } else {
    profile = null; isAdmin = false;
  }
}

supabase.auth.onAuthStateChange(async (_event, s) => {
  session = s;
  await refreshSession();
  render();
});

// ---------- Render raíz ----------
async function render() {
  root.innerHTML = '';
  root.appendChild(renderTopbar());
  if (!session) {
    if (currentPage === 'auth') root.appendChild(await AuthPage());
    else root.appendChild(await LandingPage());
  } else {
    root.appendChild(await AppShell());
  }
}

function navigate(page) {
  currentPage = page;
  render();
}

// ---------- Topbar ----------
function renderTopbar() {
  const bar = h(`
    <header class="topbar">
      <div class="wrap">
        <div class="brand" style="cursor:pointer">IMPORT<span class="dot">·</span>AI</div>
        <nav class="nav-links"></nav>
      </div>
    </header>`);
  bar.querySelector('.brand').onclick = () => navigate(session ? 'dashboard' : 'landing');
  const links = bar.querySelector('.nav-links');
  if (!session) {
    links.appendChild(h(`<button class="btn ghost small">Ingresar</button>`));
    links.lastChild.onclick = () => navigate('auth');
  } else {
    const out = h(`<button class="btn ghost small">Cerrar sesión</button>`);
    out.onclick = async () => { await supabase.auth.signOut(); toast('Sesión cerrada'); navigate('landing'); };
    links.appendChild(out);
  }
  return bar;
}

// ---------- Landing ----------
async function LandingPage() {
  const stepsHtml = IMPORT_STATUS_FLOW.map((s, i) => {
    return `<div class="manifest-step ${i === 2 ? 'current' : i < 2 ? 'done' : ''}">
      <div class="idx">0${i + 1}</div><div class="lbl">${s.label}</div>
    </div>`;
  }).join('');

  const page = h(`
    <main>
      <section class="hero wrap">
        <span class="eyebrow">Manifiesto de importación en vivo</span>
        <h1>Un contenedor lleno de decisiones,<br>convertido en una sola conversación.</h1>
        <p class="lede">IMPORT AI analiza proveedores, calcula costos reales de importación y sigue cada pedido desde que lo encuentras hasta que lo vendes — con un agente que ejecuta, no que solo sugiere.</p>
        <div class="hero-actions">
          <button class="btn" id="cta-start">Crear cuenta</button>
          <button class="btn ghost" id="cta-login">Ya tengo cuenta</button>
        </div>
        <div class="manifest">
          <div class="manifest-track">${stepsHtml}</div>
        </div>
        <div class="grid-3">
          <div class="feature-card">
            <div class="fnum">Proveedores</div>
            <h3>Análisis automático</h3>
            <p>El agente evalúa proveedores por historial, rating y plataforma antes de comprometer capital.</p>
          </div>
          <div class="feature-card">
            <div class="fnum">Costos</div>
            <h3>Cálculo de importación real</h3>
            <p>Flete, aduana y tipo de cambio actual combinados en un costo total por unidad, no una estimación.</p>
          </div>
          <div class="feature-card">
            <div class="fnum">Ejecución</div>
            <h3>Chat que actúa</h3>
            <p>Pide una tarea y el agente la ejecuta sobre tus datos reales — pedidos, inventario, pagos.</p>
          </div>
        </div>
      </section>
      <footer class="site"><div class="wrap">IMPORT AI — plataforma de importación asistida por IA.</div></footer>
    </main>`);
  page.querySelector('#cta-start').onclick = () => navigate('auth');
  page.querySelector('#cta-login').onclick = () => navigate('auth');
  return page;
}

// ---------- Auth ----------
async function AuthPage() {
  let mode = 'login';
  const page = h(`<main class="wrap"><div class="auth-shell">
    <h2 id="auth-title">Ingresar</h2>
    <div id="auth-error"></div>
    <form id="auth-form">
      <div class="field" id="name-field" style="display:none">
        <label>Nombre</label><input type="text" name="name" />
      </div>
      <div class="field"><label>Correo</label><input type="email" name="email" required /></div>
      <div class="field"><label>Contraseña</label><input type="password" name="password" required minlength="6" /></div>
      <button class="btn" style="width:100%; justify-content:center" type="submit">Ingresar</button>
    </form>
    <div class="auth-toggle">¿No tienes cuenta? <button id="toggle-mode">Crear una</button></div>
  </div></main>`);

  page.querySelector('#toggle-mode').onclick = () => {
    mode = mode === 'login' ? 'register' : 'login';
    page.querySelector('#auth-title').textContent = mode === 'login' ? 'Ingresar' : 'Crear cuenta';
    page.querySelector('#name-field').style.display = mode === 'register' ? 'block' : 'none';
    page.querySelector('button[type=submit]').textContent = mode === 'login' ? 'Ingresar' : 'Crear cuenta';
    page.querySelector('#toggle-mode').textContent = mode === 'login' ? 'Crear una' : 'Ingresar';
    page.querySelector('.auth-toggle').firstChild.textContent = mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? ';
  };

  page.querySelector('#auth-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const email = fd.get('email'), password = fd.get('password'), name = fd.get('name');
    const errBox = page.querySelector('#auth-error');
    errBox.innerHTML = '';
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
        if (error) throw error;
        if (data.user) {
          await supabase.from('users').insert({ id: data.user.id, email, name }).select().maybeSingle();
        }
      }
      await refreshSession();
      navigate('dashboard');
    } catch (err) {
      errBox.innerHTML = `<p class="error-msg">${err.message}</p>`;
    }
  };
  return page;
}

// ---------- App shell (post-login) ----------
async function AppShell() {
  const pages = [
    { key: 'dashboard', label: 'Panel' },
    { key: 'orders', label: 'Pedidos de importación' },
    { key: 'chat', label: 'Chat IA' },
    { key: 'profile', label: 'Perfil' },
  ];
  if (isAdmin) pages.push({ key: 'admin', label: 'Administración' });
  if (!['dashboard', 'orders', 'chat', 'profile', 'admin'].includes(currentPage)) currentPage = 'dashboard';

  const shell = h(`<div class="app-shell"><nav class="sidebar"></nav><div class="main-content" id="main"></div></div>`);
  const nav = shell.querySelector('.sidebar');
  pages.forEach(p => {
    const btn = h(`<button class="${p.key === currentPage ? 'active' : ''}">${p.label}</button>`);
    btn.onclick = () => navigate(p.key);
    nav.appendChild(btn);
  });

  const main = shell.querySelector('#main');
  const renderers = { dashboard: DashboardPage, orders: OrdersPage, chat: ChatPage, profile: ProfilePage, admin: AdminPage };
  main.appendChild(await renderers[currentPage]());
  return shell;
}

// ---------- Dashboard ----------
async function DashboardPage() {
  const page = h(`<section>
    <h1 class="page-title">Hola${profile?.name ? ', ' + profile.name : ''}</h1>
    <p class="page-sub">Esto es lo que está pasando con tus importaciones hoy.</p>
    <div class="stat-row" id="stats">
      <div class="stat-card"><div class="label">Saldo</div><div class="skeleton" style="width:80px;margin-top:8px"></div></div>
      <div class="stat-card"><div class="label">Pedidos activos</div><div class="skeleton" style="width:40px;margin-top:8px"></div></div>
      <div class="stat-card"><div class="label">Notificaciones</div><div class="skeleton" style="width:40px;margin-top:8px"></div></div>
    </div>
    <h3 style="font-family:var(--display)">Pedidos recientes</h3>
    <div id="recent-orders"><div class="skeleton" style="height:120px"></div></div>
  </section>`);

  (async () => {
    const [{ data: wallet }, { data: orders }, { data: notifs }] = await Promise.all([
      supabase.from('wallets').select('balance,currency').eq('user_id', session.user.id).maybeSingle(),
      supabase.from('import_orders').select('*').eq('requested_by', session.user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('notifications').select('id').eq('user_id', session.user.id).eq('is_read', false),
    ]);
    const activeOrders = (orders || []).filter(o => o.status !== 'sold').length;
    page.querySelector('#stats').innerHTML = `
      <div class="stat-card"><div class="label">Saldo</div><div class="value teal">${money(wallet?.balance, wallet?.currency || 'USD')}</div></div>
      <div class="stat-card"><div class="label">Pedidos activos</div><div class="value">${activeOrders}</div></div>
      <div class="stat-card"><div class="label">Notificaciones sin leer</div><div class="value amber">${notifs?.length || 0}</div></div>`;

    const box = page.querySelector('#recent-orders');
    if (!orders || orders.length === 0) {
      box.innerHTML = `<div class="empty-state">Todavía no tienes pedidos de importación. Cuando encuentres tu primer producto, aparecerá aquí.</div>`;
    } else {
      box.innerHTML = `<table class="data"><thead><tr><th>Producto</th><th>Plataforma</th><th>Estado</th><th>Costo total</th></tr></thead>
        <tbody>${orders.map(o => `<tr><td>${o.product_name}</td><td>${o.source_platform || '—'}</td><td>${statusBadge(o.status)}</td><td>${money(o.total_cost, o.currency || 'USD')}</td></tr>`).join('')}</tbody></table>`;
    }
  })();

  return page;
}

// ---------- Pedidos ----------
async function OrdersPage() {
  const page = h(`<section>
    <h1 class="page-title">Pedidos de importación</h1>
    <p class="page-sub">Ciclo de vida real de cada pedido, tal como lo registra el sistema.</p>
    <div id="orders-list"><div class="skeleton" style="height:200px"></div></div>
  </section>`);

  const { data: orders, error } = await supabase.from('import_orders').select('*').eq('requested_by', session.user.id).order('created_at', { ascending: false });
  const box = page.querySelector('#orders-list');
  if (error) { box.innerHTML = `<div class="empty-state">No se pudieron cargar los pedidos: ${error.message}</div>`; return page; }
  if (!orders.length) { box.innerHTML = `<div class="empty-state">Aún no registras pedidos. Usa el Chat IA para pedir que se analice un producto o proveedor.</div>`; return page; }

  box.innerHTML = orders.map(o => `
    <div class="feature-card" style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h3 style="margin:0">${o.product_name}</h3>${statusBadge(o.status)}
      </div>
      <p style="margin:10px 0 0">Cantidad: ${o.quantity || 1} · Costo unitario: ${money(o.unit_cost, o.currency || 'USD')} · Total: ${money(o.total_cost, o.currency || 'USD')}</p>
      ${o.tracking_number ? `<p style="font-family:var(--mono);font-size:13px;color:var(--paper-dim)">Guía: ${o.tracking_number}</p>` : ''}
    </div>`).join('');
  return page;
}

// ---------- Chat IA ----------
async function ChatPage() {
  const page = h(`<section>
    <h1 class="page-title">Chat IA</h1>
    <p class="page-sub">Conectado a la función <code style="font-family:var(--mono)">ai-router</code>. Pide una tarea concreta.</p>
    <div class="chat-shell">
      <div class="chat-log" id="chat-log">
        <div class="msg assistant">Soy el agente de IMPORT AI. Puedo analizar proveedores, calcular costos de importación o buscar productos. ¿Qué necesitas resolver?</div>
      </div>
      <form class="chat-input-row" id="chat-form">
        <input type="text" placeholder="Ej: calcula el costo de importar 50 unidades desde China" required />
        <button class="btn" type="submit">Enviar</button>
      </form>
    </div>
  </section>`);

  const log = page.querySelector('#chat-log');
  page.querySelector('#chat-form').onsubmit = async (e) => {
    e.preventDefault();
    const input = e.target.querySelector('input');
    const text = input.value.trim();
    if (!text) return;
    log.appendChild(h(`<div class="msg user">${text}</div>`));
    input.value = '';
    const pending = h(`<div class="msg assistant pending">Pensando…</div>`);
    log.appendChild(pending);
    log.scrollTop = log.scrollHeight;
    try {
      // ai-router espera { prompt } (no { message, user_id }: el user_id sale del JWT) y
      // responde el sobre { success, data: { text, reply }, error, metadata }.
      const res = await callEdgeFunction('ai-router', { prompt: text });
      pending.classList.remove('pending');
      pending.textContent = res?.data?.reply || res?.data?.text || 'El agente no devolvió una respuesta.';
    } catch (err) {
      pending.remove();
      log.appendChild(h(`<div class="msg assistant">No pude completar esa tarea (${err.message}). Intenta de nuevo o reformula la petición.</div>`));
      toast('Error al llamar al agente', 'error');
    }
    log.scrollTop = log.scrollHeight;
  };
  return page;
}

// ---------- Perfil ----------
async function ProfilePage() {
  const page = h(`<section>
    <h1 class="page-title">Perfil</h1>
    <p class="page-sub">Datos de tu cuenta.</p>
    <div class="feature-card" style="max-width:480px">
      <p><strong>Nombre:</strong> ${profile?.name || '—'}</p>
      <p><strong>Correo:</strong> ${profile?.email || session.user.email}</p>
      <p><strong>Rol:</strong> ${statusBadge(profile?.role || 'customer')}</p>
      <p><strong>País:</strong> ${profile?.country || '—'}</p>
      <p><strong>Estado de cuenta:</strong> ${statusBadge(profile?.status || 'active')}</p>
    </div>
  </section>`);
  return page;
}

// ---------- Admin (gated por rol real, no solo UI) ----------
async function AdminPage() {
  const page = h(`<section>
    <h1 class="page-title">Administración</h1>
    <p class="page-sub">Visibilidad operativa. Las políticas RLS deciden qué puedes ver realmente aquí.</p>
    <div class="stat-row" id="admin-stats"><div class="skeleton" style="height:60px"></div></div>
    <h3 style="font-family:var(--display)">Actividad de IA reciente</h3>
    <div id="admin-usage"><div class="skeleton" style="height:120px"></div></div>
  </section>`);

  const [{ data: snapshot }, { data: usage, error: usageErr }] = await Promise.all([
    supabase.from('system_snapshots').select('*').order('taken_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('ai_usage_logs').select('*, ai_models(model_name)').order('created_at', { ascending: false }).limit(8),
  ]);

  page.querySelector('#admin-stats').innerHTML = `
    <div class="stat-card"><div class="label">Conectores activos</div><div class="value">${snapshot?.active_connectors ?? '—'}</div></div>
    <div class="stat-card"><div class="label">Errores 24h</div><div class="value amber">${snapshot?.errors_24h ?? '—'}</div></div>
    <div class="stat-card"><div class="label">Eventos de seguridad 24h</div><div class="value">${snapshot?.security_events_24h ?? '—'}</div></div>`;

  const box = page.querySelector('#admin-usage');
  if (usageErr) { box.innerHTML = `<div class="empty-state">Sin acceso a logs (RLS): ${usageErr.message}</div>`; return page; }
  if (!usage?.length) { box.innerHTML = `<div class="empty-state">Sin actividad de IA registrada todavía.</div>`; return page; }
  box.innerHTML = `<table class="data"><thead><tr><th>Modelo</th><th>Tokens in/out</th><th>Costo</th><th>Estado</th></tr></thead>
    <tbody>${usage.map(u => `<tr><td>${u.ai_models?.model_name || '—'}</td><td>${u.input_tokens}/${u.output_tokens}</td><td>${money(u.cost)}</td><td>${statusBadge(u.status)}</td></tr>`).join('')}</tbody></table>`;
  return page;
}

// ---------- Init ----------
(async function init() {
  await refreshSession();
  await render();
})();
