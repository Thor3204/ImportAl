'use client';

import { useRef, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import Sidebar from '../../components/Sidebar';
import { supabase } from '../../lib/supabaseClient';

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
      const { data, error: fnError } = await supabase.functions.invoke('ai-router', {
        body: {
          user_id: session.user.id,
          message: text,
          history: nextMessages.slice(-10)
        }
      });
      if (fnError) throw fnError;
      const reply = data?.reply || data?.message || data?.content || JSON.stringify(data);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(err.message || 'El router de IA no respondió. Revisa ai-router y AI_MODELS en Supabase.');
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }

  return (
    <div className="flex-1 p-8 flex flex-col h-screen">
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
        <div className="flex">
          <Sidebar userEmail={session.user.email} />
          <ChatBody session={session} />
        </div>
      )}
    </AuthGuard>
  );
}
