# IMPORT AI — Frontend

Frontend SPA (HTML/CSS/JS modular, sin build step) conectado directamente al
proyecto real de Supabase **ImportAI** (`wmrzivkathiekscjbvcs`).

## 1. Auditoría Supabase (resumen)

**Base de datos** — 35 tablas en `public`, con RLS habilitado en todas.
Dominios principales:
- Comercio: `products`, `categories`, `suppliers`, `sales`, `sale_items`, `inventory`, `customers`
- Importación: `import_orders`, `import_order_events` (enum `import_status`: found → supplier_analyzed → cost_calculated → purchased → shipped → in_customs → received → stocked → sold)
- Dinero: `wallets`, `transactions`, `payments`, `escrow_orders`, `exchange_rates`
- IA/agente: `ai_models`, `ai_tools`, `ai_task_routes`, `ai_usage_logs`, `ai_memory`, `user_ai_limits`, `admin_ai_proposals`
- Conectores/MCP: `api_connectors`, `api_credentials`, `connector_actions`, `connector_mappings`, `mcp_api_keys`, `mcp_key_permissions`, `connector_usage_logs`, `tool_execution_logs`
- Seguridad/roles: `roles`, `permissions`, `role_permissions`, `user_roles`, `security_events`, `audit_logs`, `fraud_scores`, `error_codes`
- Sistema: `system_snapshots`, `notifications`, `jobs`, `job_events`, `external_integrations`, `api_health`

**Auth** — usa `auth.users` de Supabase + tabla espejo `public.users` con enum
`user_role` (customer, seller, importer, supplier, admin, super_admin, support)
y `user_status`. El frontend inserta la fila espejo en `public.users` al
registrarse.

**RLS** — activo en las 35 tablas. El frontend nunca asume permisos: cada
consulta maneja el caso de error/0 filas como "sin acceso", no como bug.

**Edge Functions activas (13)**: `ai-router`, `calculate-import`,
`calculate-shipping`, `search-products`, `analyze-supplier`, `save-memory`,
`get-history`, `currency-engine`, `connector-execute`, `rapidapi-proxy`,
`gemini-admin-diagnose`, `mcp-server` (público), `process-jobs` (público).
El chat conecta a `ai-router`; el resto quedan mapeados en
`assets/supabase-client.js` (`EDGE_FUNCTIONS`) listos para conectar en las
próximas pantallas (cálculo de importación, búsqueda de proveedores).

**Advisor de seguridad** — 1 hallazgo (WARN): la función `public.is_admin()`
es `SECURITY DEFINER` y ejecutable por `anon`/`authenticated` vía RPC.
No bloqueante para este frontend, pero recomendable revisarla:
https://supabase.com/docs/guides/database/database-linter?lint=0028

## 2. Qué se construyó

- Landing con el "manifiesto" visual (línea de estados real de `import_status`)
- Auth (login/registro) contra Supabase Auth + fila espejo en `public.users`
- Dashboard: saldo (`wallets`), pedidos recientes (`import_orders`), notificaciones sin leer
- Pedidos: listado completo de `import_orders` del usuario
- Chat IA: conectado a la Edge Function `ai-router`
- Perfil: datos de `public.users`
- Admin: solo visible si `profile.role` es `admin`/`super_admin`; sin
  embargo la seguridad real la sigue imponiendo RLS, no el frontend

## 3. Pendiente / próximos pasos recomendados

1. Conectar las pantallas de cálculo de costo (`calculate-import`,
   `calculate-shipping`) y análisis de proveedor (`analyze-supplier`) con
   formularios dedicados — hoy solo están mapeadas, no tienen UI propia.
2. Revisar/objetar el advisory de `is_admin()` con tu equipo de backend.
3. Definir política de Storage (buckets) — no había ninguno configurado al
   momento de la auditoría, así que no se construyó subida de imágenes.
4. Agregar paginación a `import_orders`/`ai_usage_logs` cuando haya volumen real.
5. Mover las claves de `assets/supabase-client.js` a variables de entorno si
   se introduce un build step (hoy es intencionalmente cero-build; la
   `anon key` es pública por diseño de Supabase, no es un secreto).

## 4. Cómo correrlo

Cualquier servidor estático sirve, por ejemplo:
```
npx serve .
```
