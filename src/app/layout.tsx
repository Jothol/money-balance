// src/app/layout.tsx
'use client';

import '@/globals.css'; // Ensure Tailwind is loaded
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col h-screen">
        <TopBar />
        <main className="flex-grow overflow-y-auto bg-blue-100">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
