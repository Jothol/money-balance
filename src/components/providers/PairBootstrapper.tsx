'use client';

import { useEffect, useMemo, useRef } from 'react';
import { usePairUsers } from '@/hooks/usePairUsers';
import { useExpenses } from '@/hooks/useExpensesStore';

export default function PairBootstrapper() {
  const { pairId, loading } = usePairUsers();
  const { state, loadForPair } = useExpenses();
  const ready = useMemo(() => typeof pairId === 'string' && pairId.length > 0 && !loading, [pairId, loading]);
  const lastLoaded = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (state.loaded && state.pairId === pairId) {
      lastLoaded.current = pairId as string;
      return;
    }
    if (lastLoaded.current === pairId) return;
    lastLoaded.current = pairId as string;
    loadForPair(pairId as string);
  }, [ready, pairId, state.loaded, state.pairId, loadForPair]);

  return null;
}
