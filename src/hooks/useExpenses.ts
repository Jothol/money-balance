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
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import type { Expense } from '@/types/Expense';

type PeriodKind = 'day' | 'week' | 'month';

export interface UseExpensesOptions {
  kind?: PeriodKind;        // 'day' | 'week' | 'month'
  periodId?: string;        // e.g. '2025-08-01' | '2025-W31' | '2025-08'
  includeArchived?: boolean; // default false
  orderByCreatedAtDesc?: boolean; // default true
}

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

export function useExpenses(pairId?: string | null, opts?: UseExpensesOptions) {
  const {
    kind,
    periodId,
    includeArchived = false,
    orderByCreatedAtDesc = true,
  } = opts ?? {};

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
      const constraints: QueryConstraint[] = [
        where('pairId', '==', pairId),
      ];

      if (!includeArchived) {
        constraints.push(where('archived', '==', false));
      }

      if (kind && periodId) {
        // Filter by the period field (e.g., 'day', 'week', 'month')
        constraints.push(where(kind, '==', periodId));
      }

      const baseQuery = query(
        collection(db, 'expenses'),
        ...constraints
      );

      const qy = withOrder && orderByCreatedAtDesc
        ? query(baseQuery, orderBy('createdAt', 'desc'))
        : baseQuery;

      unsub = onSnapshot(
        qy,
        onNext,
        (err: FirestoreError) => {
          // Missing composite index? fall back without orderBy once.
          if (err.code === 'failed-precondition' && withOrder && !fellBack) {
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
    return () => { if (unsub) unsub(); };
  }, [pairId, kind, periodId, includeArchived, orderByCreatedAtDesc]);

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
