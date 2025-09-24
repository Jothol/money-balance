'use client';

import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase/firebase';
import { hasPair } from '@/lib/hasPair';
import { ExpensesProvider } from '@/hooks/useExpensesStore';
import PairBootstrapper from '@/components/providers/PairBootstrapper';
import ReadyGate from '@/components/ReadyGate';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const navigated = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) {
        if (!navigated.current) {
          navigated.current = true;
          router.replace('/');
        }
        setReady(false);
        return;
      }
      const ok = await hasPair(u.uid);
      if (!ok) {
        if (!navigated.current) {
          navigated.current = true;
          router.replace('/link');
        }
        setReady(false);
        return;
      }
      setReady(true);
    });
    return () => unsub();
  }, [router]);

  if (!ready) return null;

  return (
    <ExpensesProvider>
      <PairBootstrapper />
      <ReadyGate>
        <div className="flex flex-col h-full">
          <TopBar />
          <main className="flex-1 min-h-0 overflow-y-auto bg-blue-100 -mt-4 pt-4 rounded-t-2xl shadow-[0_-6px_20px_rgba(0,0,0,0.15)] relative z-0">
            {children}
          </main>
          <BottomNav />
        </div>
      </ReadyGate>
    </ExpensesProvider>
  );
}
