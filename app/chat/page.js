'use client';

import { useRef, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import AppShell from '../../components/AppShell';
import { supabase } from '../../lib/supabaseClient';

// Mismo sobre que el resto de las Edge Functions: { success, data, error, metadata }
async function unwrapFunctionResponse(data, fnError) {
  if (fnError) {
    let message = fnError.message;
    try {
      if (fnError.context && typeof fnError.context.json === 'function') {
        const body = await fnError.context.json();
        if (body?.error?.message) message = body.error.message;
      }
    } catch {
      // sin body legible
    }
    throw new Error(message);
  }
  if (data && data.success === false) {
    throw new Error(data.error?.message || 'La función respondió con un error.');
  }
  return data?.data ?? data;
}

function ChatBody({ session }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hola, soy el analista IA de Import AI. Pregunta por productos, proveedores o cálculos de importación.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // ai-router espera { prompt|message, context: [{role, content}], task_type?, preferred_provider? }
      // El historial va en "context" (sin el mensaje actual, que ya va en "message").
      const priorContext = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));

      const { data, error: fnError } = await supabase.functions.invoke('ai-router', {
        body: {
          message: text,
          context: priorContext,
          task_type: 'general'
        }
      });
      const payload = await unwrapFunctionResponse(data, fnError);
      const reply = payload?.reply || payload?.text || payload?.message || 'Sin respuesta del modelo.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(err.message || 'El router de IA no respondió. Revisa que GEMINI_API_KEY esté en Edge Functions → Secrets.');
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col h-[100dvh] md:h-screen">
      <h1 className="text-2xl font-bold mb-1">Chat IA</h1>
      <p className="text-white/40 text-sm mb-6">Conectado a la Edge Function <code className="text-accent2">ai-router</code>.</p>

      <div className="card flex-1 p-5 overflow-y-auto space-y-4 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-accent text-white' : 'bg-panel2 border border-border text-white/90'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-white/40 text-sm">Pensando…</div>}
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-3">
        <input
          className="input"
          placeholder="Escribe tu mensaje…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn-primary" type="submit" disabled={loading}>
          Enviar
        </button>
      </form>
    </div>
  );
}

export default function ChatPage() {
  return (
    <AuthGuard>
      {(session) => (
        <AppShell userEmail={session.user.email}>
          <ChatBody session={session} />
        </AppShell>
      )}
    </AuthGuard>
  );
}
