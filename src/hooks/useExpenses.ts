// hooks/useExpenses.ts
import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  type FirestoreError,
  type QuerySnapshot,
  type QueryDocumentSnapshot,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import type { Expense } from '@/types/Expense';

const lower = (s?: string | null) => (s ?? '').toLowerCase();

function mapExpenseDoc(d: QueryDocumentSnapshot<DocumentData>, fallbackPairId: string): Expense {
  const raw = d.data() as DocumentData;
  return {
    id: d.id,
    pairId: String((raw.pairId as string | undefined) ?? fallbackPairId),
    user: raw.user as string | undefined,
    from: raw.from as string | undefined,
    to: raw.to as string | undefined,
    amount: Number(raw.amount ?? 0),
    description: raw.description as string | undefined,
    date: String(raw.date ?? ''),
    shared: Boolean(raw.shared),
    isPrivate: Boolean(raw.isPrivate),
    type: raw.type as Expense['type'],
  };
}

export function useExpenses(pairId?: string | null) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(!!pairId);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!pairId) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    let unsub: Unsubscribe | undefined;
    let fellBack = false;

    const onNext = (snap: QuerySnapshot<DocumentData>) => {
      const data: Expense[] = snap.docs.map((d) => mapExpenseDoc(d, pairId));
      setExpenses(data);
      setLoading(false);
    };

    const start = (withOrder: boolean) => {
      const base = [collection(db, 'expenses'), where('pairId', '==', pairId)] as const;
      const qy = withOrder ? query(...base, orderBy('createdAt', 'desc')) : query(...base);
      unsub = onSnapshot(
        qy,
        onNext,
        (err: FirestoreError) => {
          // If a composite index is missing for (pairId asc, createdAt desc), fall back without orderBy
          if (err.code === 'failed-precondition' && !fellBack) {
            fellBack = true;
            start(false);
          } else {
            setError(err);
            setLoading(false);
          }
        }
      );
    };

    start(true);
    return () => {
      if (unsub) unsub();
    };
  }, [pairId]);

  // Case-insensitive helpers
  const getShared = (userEmail: string) =>
    expenses.filter(
      (e) =>
        e.shared &&
        e.type !== 'gift' &&
        e.type !== 'payment' &&
        lower(e.user) === lower(userEmail)
    );

  const getPaymentsFrom = (userEmail: string) =>
    expenses.filter((e) => e.type === 'payment' && lower(e.from) === lower(userEmail));

  const getGiftsFrom = (userEmail: string) =>
    expenses.filter((e) => e.type === 'gift' && lower(e.user) === lower(userEmail));

  return { expenses, loading, error, getShared, getPaymentsFrom, getGiftsFrom };
}
