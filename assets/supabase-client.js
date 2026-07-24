// Configuración central de conexión a Supabase.
// Proyecto: ImportAI (wmrzivkathiekscjbvcs)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const SUPABASE_URL = 'https://wmrzivkathiekscjbvcs.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtcnppdmthdGhpZWtzY2pidmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NjU2NTYsImV4cCI6MjEwMDQ0MTY1Nn0.Req_egNhrwIHalXwISyk0BOA6crRySy2lhqvVOebY4E';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Mapa Frontend -> Edge Function, según auditoría del proyecto.
// Todas requieren sesión (verify_jwt: true) salvo mcp-server y process-jobs.
export const EDGE_FUNCTIONS = {
  aiRouter: 'ai-router',
  calculateImport: 'calculate-import',
  calculateShipping: 'calculate-shipping',
  searchProducts: 'search-products',
  analyzeSupplier: 'analyze-supplier',
  saveMemory: 'save-memory',
  getHistory: 'get-history',
  currencyEngine: 'currency-engine',
  connectorExecute: 'connector-execute',
  rapidapiProxy: 'rapidapi-proxy',
  adminDiagnose: 'gemini-admin-diagnose',
};

export async function callEdgeFunction(name, body = {}) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    // Cuando la función responde 4xx/5xx (ej. límite de créditos excedido, prompt inválido),
    // supabase-js solo da un error genérico de HTTP y el cuerpo real queda en error.context.
    // Sin esto se pierde el mensaje real (código AI-002, AI-004, etc.) y en el chat se ve
    // un error genérico en vez de "límite excedido".
    if (error.context && typeof error.context.json === 'function') {
      try {
        const parsed = await error.context.json();
        if (parsed?.error?.message) {
          const e = new Error(parsed.error.message);
          e.code = parsed.error.code;
          throw e;
        }
      } catch (_) { /* si no se puede parsear el cuerpo, cae al error original */ }
    }
    throw error;
  }
  return data;
}

// Estados del ciclo de vida de una orden de importación (enum import_status real de la DB).
// Este orden es la base del "manifiesto" visual usado en dashboard y landing.
export const IMPORT_STATUS_FLOW = [
  { key: 'found', label: 'Encontrado' },
  { key: 'supplier_analyzed', label: 'Proveedor analizado' },
  { key: 'cost_calculated', label: 'Costo calculado' },
  { key: 'purchased', label: 'Comprado' },
  { key: 'shipped', label: 'Enviado' },
  { key: 'in_customs', label: 'En aduana' },
  { key: 'received', label: 'Recibido' },
  { key: 'stocked', label: 'En inventario' },
  { key: 'sold', label: 'Vendido' },
];
