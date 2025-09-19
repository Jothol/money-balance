'use client';

import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import { ReactNode, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase/firebase';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) router.replace('/');
      else setReady(true);
    });
    return () => unsub();
  }, [router]);

  if (!ready) return null;

  return (
    <div className="flex flex-col h-full">
      <TopBar />
      <main className="flex-grow overflow-y-auto bg-blue-100 -mt-4 pt-4 rounded-t-2xl shadow-[0_-6px_20px_rgba(0,0,0,0.15)] relative z-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
