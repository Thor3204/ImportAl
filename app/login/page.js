'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.replace('/dashboard');
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;

        if (data.user) {
          await supabase.from('users').upsert({
            id: data.user.id,
            email,
            name: name || null
          });
        }

        if (data.session) {
          router.replace('/dashboard');
        } else {
          setInfo('Cuenta creada. Revisa tu correo para confirmar el registro antes de entrar.');
          setMode('login');
        }
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-2xl font-bold">Import <span className="text-accent">AI</span></div>
          <div className="text-sm text-white/40 mt-1">Centro inteligente de importaciones</div>
        </div>

        <div className="card p-6">
          <div className="flex mb-5 text-sm rounded-lg overflow-hidden border border-border">
            <button
              className={`flex-1 py-2 ${mode === 'login' ? 'bg-accent/20 text-accent' : 'text-white/50'}`}
              onClick={() => setMode('login')}
              type="button"
            >
              Entrar
            </button>
            <button
              className={`flex-1 py-2 ${mode === 'signup' ? 'bg-accent/20 text-accent' : 'text-white/50'}`}
              onClick={() => setMode('signup')}
              type="button"
            >
              Crear cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <input
                className="input"
                placeholder="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <input
              className="input"
              type="email"
              placeholder="Correo"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="input"
              type="password"
              placeholder="Contraseña"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <p className="text-red-400 text-sm">{error}</p>}
            {info && <p className="text-accent2 text-sm">{info}</p>}

            <button className="btn-primary w-full" type="submit" disabled={loading}>
              {loading ? 'Procesando…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
