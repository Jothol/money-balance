'use client';

import { useEffect, useMemo, useState } from 'react';
import { db } from '@/firebase/firebase';
import { Timestamp, collection, onSnapshot, query, where } from 'firebase/firestore';
import { Expense } from '@/types/Expense';

type SharedExpense = Expense & { createdAt?: Timestamp };

function cmpDesc(a: SharedExpense, b: SharedExpense) {
  const da = a.date ?? '';
  const dbs = b.date ?? '';
  if (da < dbs) return 1;
  if (da > dbs) return -1;
  const ma = a.createdAt ? a.createdAt.toMillis() : 0;
  const mb = b.createdAt ? b.createdAt.toMillis() : 0;
  return mb - ma;
}

export function useSharedExpenses(pairId: string) {
  const [items, setItems] = useState<SharedExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const canRun = useMemo(() => pairId.length > 0, [pairId]);

  useEffect(() => {
    if (!canRun) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError('');
    const col = collection(db, 'expenses');
    const q = query(col, where('pairId', '==', pairId));
    const unsub = onSnapshot(
      q,
      snap => {
        const all = snap.docs.map(d => {
          const data = d.data() as SharedExpense;
          return { ...data, id: data.id ?? d.id };
        });
        const sharedOnly = all.filter(
          r => r.type === 'payment' || r.type === 'gift' || (r.type === 'purchase' && r.shared === true)
        );
        setItems(sharedOnly.sort(cmpDesc));
        setLoading(false);
      },
      () => {
        setError('Failed to load');
        setLoading(false);
      }
    );
    return () => unsub();
  }, [canRun, pairId]);

  return { items, loading, error, refresh: () => {} };
}
