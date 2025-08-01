import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '@/firebase/firebase';
import { Expense } from '@/types/Expense';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    async function fetchExpenses() {
      try {
        const snapshot = await getDocs(collection(db, 'expenses'));
        const data: Expense[] = snapshot.docs.map(doc => {
          const raw = doc.data();
          return {
            id: doc.id,
            type: raw.type ?? 'purchase',
            shared: raw.shared ?? false,
            isPrivate: raw.isPrivate ?? false,
            ...raw,
          } as Expense;
        });
        setExpenses(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchExpenses();
  }, []);

  const getShared = (user: string) =>
    expenses.filter(e => e.shared && e.user === user && e.type !== 'gift' && e.type !== 'payment');

  const getPaymentsFrom = (user: string) =>
    expenses.filter(e => e.type === 'payment' && e.from === user);

  const getGiftsFrom = (user: string) =>
    expenses.filter(e => e.type === 'gift' && e.user === user);

  return { expenses, loading, error, getShared, getPaymentsFrom, getGiftsFrom };
}
