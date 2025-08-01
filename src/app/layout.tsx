'use client';

import '@/globals.css';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col h-screen">
        <TopBar />
        <main className="flex-grow overflow-y-auto bg-blue-100 -mt-4 pt-4 rounded-t-2xl shadow-[0_-6px_20px_rgba(0,0,0,0.15)] relative z-0">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
