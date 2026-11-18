import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { PwaRegistration } from '@/components/common/PwaRegistration';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MosqueSignage Kiosk Display',
  description: 'Open-source, modular digital signage appliance for community centers and mosques',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MosqueSignage',
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${outfit.variable}`} data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var match = document.cookie.match(/(?:^|; )mosque_admin_theme=(light|dark)/);
                  var theme = match ? match[1] : (localStorage.getItem('mosque_admin_theme') || 'dark');
                  var isDark = theme === 'dark';
                  document.documentElement.classList.toggle('dark', isDark);
                  document.documentElement.classList.toggle('light', !isDark);
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}

                // Register service worker as early as possible so controller activates immediately
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                }

                // Capture early PWA beforeinstallprompt event before React hydration (Halaqah OS global cache)
                window.addEventListener('beforeinstallprompt', function(e) {
                  e.preventDefault();
                  window.__deferredPrompt = e;
                  window.deferredPwaPrompt = e;
                  window.dispatchEvent(new Event('pwa-prompt-ready'));
                  window.dispatchEvent(new CustomEvent('pwa:install-available'));
                });
              })();
            `,
          }}
        />
      </head>
      <body className="bg-[var(--admin-bg)] text-[var(--admin-text-primary)] min-h-screen m-0 p-0 font-sans transition-colors duration-200" suppressHydrationWarning>
        <PwaRegistration />
        {children}
      </body>
    </html>
  );
}
