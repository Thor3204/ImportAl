# Import AI — Frontend

Centro inteligente de importaciones: Next.js 14 + Supabase, conectado de verdad al proyecto **ImportAI** (`wmrzivkathiekscjbvcs`).

> Nota: este repo tenía un prototipo estático previo (`index.html`, `assets/`). Este commit añade la app real en Next.js (`app/`, `components/`, `lib/`); el prototipo estático puede borrarse cuando confirmes que ya no lo necesitas.

## Estado real del backend (auditado 24 jul 2026)

- 46 tablas en `public`, RLS activo con políticas reales tipo owner-or-admin.
- 14 Edge Functions **ACTIVAS**: `ai-router`, `search-products`, `analyze-supplier`, `calculate-import`, `calculate-shipping`, `currency-engine`, `connector-execute`, `rapidapi-proxy`, `mcp-server`, `save-memory`, `get-history`, `process-jobs`, `gemini-admin-diagnose`.
- **`api_connectors` está vacío**: ningún conector RapidAPI (AliExpress/1688/Taobao/SHEIN) está cargado todavía. El buscador y el chat llaman a las Edge Functions reales, pero sin conectores configurados devolverán error o vacío — es esperado, no es un bug del frontend.

## APIs / credenciales que faltan

1. **RapidAPI key** + suscripción específica por proveedor (AliExpress Data API, 1688, Taobao son suscripciones distintas, no una sola key sirve para todas).
2. **OpenAI key**: ya la cargaste — falta confirmar que `ai-router` la lee del secret correcto (Edge Functions → Secrets en Supabase).
3. **API de tasas de cambio** (ej. exchangerate.host): existe `currency-engine` y la tabla `exchange_rates`, ambas sin datos.
4. **Pasarela de pago** (ej. Stripe): no existe nada en el schema. Necesaria si vas a cobrar créditos IA o suscripciones.
5. **API de envíos/courier** (DHL, 4PX, etc.) si quieres tracking real en vez de `tracking_number` manual.

## Pantallas incluidas en esta entrega

- `/login` — auth real con Supabase Auth (email + password), crea la fila espejo en `public.users`.
- `/dashboard` — wallet, límites de IA, últimas importaciones, notificaciones (datos reales).
- `/search` — llama a `search-products`.
- `/chat` — llama a `ai-router`.
- `/orders` — CRUD real sobre `import_orders` + timeline de `import_order_events`.
- `/admin` — visible solo para rol `admin`/`super_admin`; usuarios, conectores, último snapshot.

Pendiente del PRD original (no incluido aún): análisis completo de rentabilidad/riesgo (Fase 3), diseño premium final (Fase 8), hardening de seguridad para producción (Fase 10).

## Setup local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Las variables de `.env.example` ya apuntan al proyecto real de Supabase (URL + anon key pública).

## Nota importante

Este código se subió directamente al repo desde Claude, sin un entorno con acceso a internet para correr `npm install` / `npm run build` y confirmar que compila sin errores. Corre el build apenas lo clones; si algo falla, pásame el error exacto y lo corrijo.
