'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-bg text-white flex items-center justify-center px-4">
        <div className="card p-6 max-w-md text-center">
          <div className="text-lg font-semibold mb-2">Algo salió mal</div>
          <p className="text-white/50 text-sm mb-4">{error?.message || 'Error inesperado en la aplicación.'}</p>
          <button className="btn-primary" onClick={() => reset()}>
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
