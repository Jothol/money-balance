'use client';

import { useEffect, useMemo, useState } from 'react';
import { db } from '@/firebase/firebase';
import { Timestamp, collection, onSnapshot, query, where } from 'firebase/firestore';
import { Expense } from '@/types/Expense';

type PersonalExpense = Expense & { createdAt?: Timestamp };

function cmpDesc(a: PersonalExpense, b: PersonalExpense) {
  const da = a.date ?? '';
  const dbs = b.date ?? '';
  if (da < dbs) return 1;
  if (da > dbs) return -1;
  const ma = a.createdAt ? a.createdAt.toMillis() : 0;
  const mb = b.createdAt ? b.createdAt.toMillis() : 0;
  return mb - ma;
}

export function usePersonalExpenses(pairId: string) {
  const [items, setItems] = useState<PersonalExpense[]>([]);
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
    const q = query(
      col,
      where('pairId', '==', pairId),
      where('type', '==', 'purchase'),
      where('shared', '==', false),
      where('isPrivate', '==', false)
    );
    const unsub = onSnapshot(
      q,
      snap => {
        const rows = snap.docs.map(d => {
          const data = d.data() as PersonalExpense;
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
  }, [canRun, pairId]);

  return { items, loading, error, refresh: () => {} };
}
