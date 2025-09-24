'use client';

import { useEffect, useMemo, useState } from 'react';
import { db } from '@/firebase/firebase';
import { Timestamp, collection, onSnapshot, query, where } from 'firebase/firestore';
import { Expense } from '@/types/Expense';

type PrivateExpense = Expense & { createdAt?: Timestamp };

function cmpDesc(a: PrivateExpense, b: PrivateExpense) {
  const da = a.date ?? '';
  const dbs = b.date ?? '';
  if (da < dbs) return 1;
  if (da > dbs) return -1;
  const ma = a.createdAt ? a.createdAt.toMillis() : 0;
  const mb = b.createdAt ? b.createdAt.toMillis() : 0;
  return mb - ma;
}

export function usePrivateExpenses(pairId: string, selfEmailLower: string) {
  const [items, setItems] = useState<PrivateExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const canRun = useMemo(() => pairId.length > 0 && selfEmailLower.length > 0, [pairId, selfEmailLower]);

  useEffect(() => {
    if (!canRun) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError('');
    const col = collection(db, 'expenses');
    const q = query(
      col,
      where('pairId', '==', pairId),
      where('type', '==', 'purchase'),
      where('isPrivate', '==', true),
      where('user', '==', selfEmailLower)
    );
    const unsub = onSnapshot(
      q,
      snap => {
        const rows = snap.docs.map(d => {
          const data = d.data() as PrivateExpense;
          return { ...data, id: data.id ?? d.id };
        });
        setItems(rows.sort(cmpDesc));
        setLoading(false);
      },
      () => {
        setError('Failed to load');
        setLoading(false);
      }
    );
    return () => unsub();
  }, [canRun, pairId, selfEmailLower]);

  return { items, loading, error, refresh: () => {} };
}
