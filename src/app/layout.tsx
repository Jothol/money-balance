import '@/globals.css';
import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-whiteBrand">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#084668" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#084668" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Evenly" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-whiteBrand">
        <div className="fixed top-0 left-0 right-0 h-[env(safe-area-inset-top)] bg-[#084668] pointer-events-none z-[9999]" />
        <div className="app-shell">
          <div className="pt-[env(safe-area-inset-top)] scroll-area">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
