# Import AI — Frontend

Centro inteligente de importaciones: Next.js 14 + Supabase, conectado de verdad al proyecto **ImportAI** (`wmrzivkathiekscjbvcs`).

## Estado — 24 jul 2026, auditoría final

**NO READY para beta todavía.** El código, auth, dashboard, IA y RLS están correctos. El bloqueante real es que `api_connectors` sigue vacío: sin eso, `/search` y las respuestas del chat sobre productos no van a traer nada de RapidAPI.

### Checklist final

- [x] GitHub tiene el código más reciente (verificado árbol completo del repo)
- [x] Prototipo estático viejo (`index.html`, `assets/`) eliminado — ya no hay código muerto
- [x] Supabase correcto (46 tablas, RLS con políticas owner-or-admin reales)
- [x] Auth correcto (Supabase Auth + fila espejo en `public.users`, protegida contra auto-escalación de rol por un trigger ya existente en el proyecto: `protect_user_privilege_columns`)
- [x] `ai-router` funcional: modelo activo (`openai / gpt-4.1-mini`), lee `OPENAI_API_KEY`, descuenta uso vía RPC `record_ai_usage` (no vía insert directo del cliente, por diseño de RLS)
- [x] Créditos funcionando: `user_ai_limits` solo lo puede tocar un admin o la propia Edge Function (RLS confirmado, usuario normal no puede inflar su propio límite)
- [x] Bug corregido: el frontend esperaba respuestas "planas" de `ai-router`/`search-products`, pero ambas devuelven siempre `{ success, data, error, metadata }`. Ya corregido en `/chat` y `/search`.
- [x] Bug corregido: `/chat` mandaba `history`, pero `ai-router` lee `context`. Ya corregido.
- [ ] **RapidAPI lista: NO.** `api_connectors` tiene 0 filas. Aunque ya cargaste los secrets de RapidAPI en Supabase, `search-products` → `connector-execute` exige además una fila en `api_connectors` (con `name` = `aliexpress`/`1688`/`taobao`/`shein`, `status='active'`), una fila en `connector_actions` (`search_products`, endpoint, mapping) y una fila en `api_credentials` que apunte al nombre exacto del secret. Sin eso, la Edge Function responde `MKT-001: Marketplace no configurado` — es un fallo esperado, no un bug del código.
- [ ] Búsqueda de productos lista: depende del punto anterior.
- [ ] **Build: NO CONFIRMADO.** Mi entorno no tiene acceso a internet para correr `npm install` / `npm run build`. Revisión estática del código no encontró imports rotos ni sintaxis inválida, pero esto no reemplaza un build real. Corre `npm install && npm run build` apenas puedas y pásame el error si algo falla.
- [ ] Deploy: preparar recién después de que el build esté confirmado.

### Bloqueantes restantes (en orden de prioridad)

1. Cargar conectores reales en `api_connectors` + `connector_actions` + `api_credentials` para al menos AliExpress (mínimo viable). Puedo ayudarte a insertar esas filas si me pasas el endpoint/host exacto de tu suscripción RapidAPI.
2. Correr `npm install && npm run build` en tu máquina o en Vercel y confirmar que compila.
3. Probar el flujo end-to-end real: registro → login → chat (ya debería funcionar) → búsqueda (bloqueada hasta el punto 1) → crear importación → ver timeline.

### Riesgo ya corregido en esta auditoría

`users_update_self` (RLS) permite a un usuario editar cualquier columna de su propia fila via UPDATE. Confirmé que ya existía un trigger (`protect_user_privilege_columns`) que bloquea cambios de `role`/`status` salvo que quien ejecuta sea admin — así que no era una vulnerabilidad activa, pero vale la pena que sepas que ese trigger es la única barrera para esto y no debe borrarse.

## APIs / credenciales que faltan

1. **RapidAPI**: key ya cargada como secret, pero faltan las filas de configuración en `api_connectors`/`connector_actions`/`api_credentials` (ver bloqueante #1).
2. **API de tasas de cambio** (ej. exchangerate.host): existe `currency-engine` y la tabla `exchange_rates`, ambas sin datos.
3. **Pasarela de pago** (ej. Stripe): no existe nada en el schema. Necesaria si vas a cobrar créditos IA o suscripciones.
4. **API de envíos/courier** (DHL, 4PX, etc.) si quieres tracking real en vez de `tracking_number` manual.

## Pantallas incluidas

- `/login` — auth real con Supabase Auth (email + password), crea la fila espejo en `public.users`.
- `/dashboard` — wallet, límites de IA, últimas importaciones, notificaciones (datos reales).
- `/search` — llama a `search-products` (bloqueado por falta de conectores, ver arriba).
- `/chat` — llama a `ai-router`, funcional con OpenAI.
- `/orders` — CRUD real sobre `import_orders` + timeline de `import_order_events`.
- `/admin` — visible solo para rol `admin`/`super_admin`; usuarios, conectores, último snapshot.

Pendiente del PRD original (no incluido): análisis completo de rentabilidad/riesgo (Fase 3 del PRD), diseño premium final (Fase 8), hardening adicional de seguridad para producción (Fase 10).

## Setup local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Las variables de `.env.example` ya apuntan al proyecto real de Supabase (URL + anon key pública).
