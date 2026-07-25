import { Inter } from 'next/font/google';
import './globals.css';
import ServiceWorkerRegister from '../components/ServiceWorkerRegister';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata = {
  title: 'Import AI',
  description: 'Centro inteligente de importaciones — IA + conectores + rentabilidad',
  manifest: '/manifest.json',
  applicationName: 'Import AI',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Import AI'
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png'
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#050505'
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen bg-bg text-white antialiased font-sans">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
