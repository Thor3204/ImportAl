'use client';

import { useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import Sidebar from '../../components/Sidebar';
import { supabase } from '../../lib/supabaseClient';

function SearchBody() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('search-products', {
        body: { query }
      });
      if (fnError) throw fnError;
      const items = Array.isArray(data) ? data : data?.results || data?.products || [];
      setResults(items);
    } catch (err) {
      setError(
        err.message ||
          'No se pudo completar la búsqueda. Es probable que aún no haya conectores (RapidAPI) configurados en api_connectors.'
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 p-8">
      <h1 className="text-2xl font-bold mb-1">Buscador inteligente de productos</h1>
      <p className="text-white/40 text-sm mb-6">
        Llama a la Edge Function <code className="text-accent2">search-products</code>, que despacha por los conectores activos en{' '}
        <code>api_connectors</code>.
      </p>

      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input
          className="input"
          placeholder="Ej: audífonos bluetooth"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn-primary whitespace-nowrap" disabled={loading} type="submit">
          {loading ? 'Buscando…' : 'Buscar'}
        </button>
      </form>

      {error && (
        <div className="card p-4 border-red-500/30 text-red-300 text-sm mb-6">
          {error}
        </div>
      )}

      {!error && searched && !loading && results.length === 0 && (
        <p className="text-white/40 text-sm">Sin resultados para esa búsqueda.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((p, i) => (
          <div key={p.id || i} className="card p-4">
            {p.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image} alt={p.name || 'producto'} className="w-full h-36 object-cover rounded-lg mb-3" />
            )}
            <div className="font-medium text-sm mb-1">{p.name || p.title || 'Producto'}</div>
            <div className="text-accent2 font-bold">{p.price ? `$${p.price}` : '—'}</div>
            <div className="text-xs text-white/40 mt-1">
              {p.supplier || p.platform || ''} {p.rating ? `★ ${p.rating}` : ''}
            </div>
            {p.url && (
              <a href={p.url} target="_blank" rel="noreferrer" className="text-xs text-accent mt-2 inline-block">
                Ver producto →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <AuthGuard>
      {(session) => (
        <div className="flex">
          <Sidebar userEmail={session.user.email} />
          <SearchBody />
        </div>
      )}
    </AuthGuard>
  );
}
