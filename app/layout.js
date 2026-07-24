import './globals.css';

export const metadata = {
  title: 'Import AI',
  description: 'Centro inteligente de importaciones — IA + conectores + rentabilidad'
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-bg text-white antialiased">{children}</body>
    </html>
  );
}
