'use client';

import { ReactNode, useMemo } from 'react';
import { usePairUsers } from '@/hooks/usePairUsers';
import { useExpenses } from '@/hooks/useExpensesStore';

export default function ReadyGate({ children }: { children: ReactNode }) {
  const { pairId, loading } = usePairUsers();
  const { state } = useExpenses();
  const ready = useMemo(
    () => typeof pairId === 'string' && pairId.length > 0 && !loading && state.loaded && !state.loading,
    [pairId, loading, state.loaded, state.loading]
  );
  if (!ready) return <div className="p-4 text-gray-500">Loading…</div>;
  return <>{children}</>;
}
