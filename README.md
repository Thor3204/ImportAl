# Import AI — Frontend

Centro inteligente de importaciones: Next.js 14 + Supabase, conectado de verdad al proyecto **ImportAI** (`wmrzivkathiekscjbvcs`).

## Estado — 25 jul 2026, tras migración IA + rediseño PWA

**NO READY para beta todavía.** Se completaron la migración de IA a Gemini y el rediseño completo del frontend a PWA mobile-first. El bloqueante real sigue siendo el mismo de la auditoría anterior: `api_connectors` sigue vacío, así que `/search` y las respuestas del chat sobre productos no van a traer nada de RapidAPI.

### Checklist actualizado

- [x] **Migración a Gemini (Fase 1):** `ai_models` tiene `gemini-2.0-flash` como modelo activo y prioritario (`is_fallback=false`); `openai / gpt-4.1-mini` quedó como fallback secundario, no obligatorio. El código de `ai-router` ya soportaba multi-proveedor de fábrica, no hizo falta tocarlo. `ai_task_routes` sigue enrutando por tipo de tarea (`coding`→openai, `supplier_analysis`→claude, el resto→gemini).
- [x] **Rediseño PWA mobile-first (Fases 2-9):** nuevo `AppShell.js` con bottom navigation fija en móvil + sidebar colapsable (persiste estado) en desktop, reemplazando el `Sidebar.js` viejo que tapaba la pantalla. Nueva paleta dark premium (`#050505` + accent `#8B5CF6`), cards con efecto glass, tipografía Inter. Manifest, service worker (network-first, nunca cachea llamadas a Supabase) e íconos generados — la app se puede instalar como PWA.
- [x] Overflow horizontal corregido en la tabla de admin y en los formularios de `/orders` y `/search` para 390px.
- [x] Supabase correcto (46 tablas, RLS con políticas owner-or-admin reales)
- [x] Auth correcto (Supabase Auth + fila espejo en `public.users`, protegida contra auto-escalación de rol por `protect_user_privilege_columns`)
- [x] Créditos funcionando: `user_ai_limits` solo lo puede tocar un admin o la propia Edge Function (RLS confirmado)
- [ ] **RapidAPI lista: NO.** `api_connectors` tiene 0 filas. Aunque los secrets de RapidAPI ya están en Supabase, `search-products` → `connector-execute` exige además una fila en `api_connectors` (con `name` = `aliexpress`/`1688`/`taobao`/`shein`, `status='active'`), una fila en `connector_actions` (`search_products`, endpoint, mapping) y una fila en `api_credentials` que apunte al nombre exacto del secret. Sin eso, la Edge Function responde `MKT-001: Marketplace no configurado` — es un fallo esperado, no un bug del código. Desde `/admin` ya se puede crear el conector con un formulario.
- [ ] Búsqueda de productos lista: depende del punto anterior.
- [ ] **Build: NO CONFIRMADO.** Este entorno no tiene acceso a internet para correr `npm install` / `npm run build`. Se verificó la sintaxis de todos los `.js` con el compilador de TypeScript (sin errores), pero eso no reemplaza un build real. Corre `npm install && npm run build` en Vercel o tu máquina y avisa si algo falla.
- [ ] Deploy: preparar recién después de que el build esté confirmado.

### Bloqueantes restantes (en orden de prioridad)

1. Cargar conectores reales en `api_connectors` + `connector_actions` + `api_credentials` para al menos AliExpress (mínimo viable) — ya hay un formulario en `/admin` para esto, solo falta el host/endpoint real de tu suscripción RapidAPI.
2. Correr `npm install && npm run build` en tu máquina o en Vercel y confirmar que compila.
3. Probar el flujo end-to-end real: registro → login → chat (Gemini) → búsqueda (bloqueada hasta el punto 1) → crear importación → ver timeline.
4. Probar instalación como PWA en Chrome Android / Safari iOS.

## APIs / credenciales que faltan

1. **RapidAPI**: key ya cargada como secret, pero faltan las filas de configuración en `api_connectors`/`connector_actions`/`api_credentials` (ver bloqueante #1).
2. **API de tasas de cambio** (ej. exchangerate.host): existe `currency-engine` y la tabla `exchange_rates`, ambas sin datos.
3. **Pasarela de pago** (ej. Stripe): no existe nada en el schema. Necesaria si vas a cobrar créditos IA o suscripciones.
4. **API de envíos/courier** (DHL, 4PX, etc.) si quieres tracking real en vez de `tracking_number` manual.

## Pantallas incluidas

- `/login` — auth real con Supabase Auth (email + password), crea la fila espejo en `public.users`.
- `/dashboard` — wallet, límites de IA, últimas importaciones, notificaciones (datos reales).
- `/search` — llama a `search-products` (bloqueado por falta de conectores, ver arriba).
- `/chat` — llama a `ai-router`, ahora enrutado a Gemini por defecto.
- `/orders` — CRUD real sobre `import_orders` + timeline de `import_order_events`.
- `/admin` — visible solo para rol `admin`/`super_admin`; usuarios, conectores (con formulario de alta), último snapshot.

Pendiente: hardening adicional de seguridad para producción, análisis completo de rentabilidad/riesgo.

## Setup local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Las variables de `.env.example` ya apuntan al proyecto real de Supabase (URL + anon key pública).
