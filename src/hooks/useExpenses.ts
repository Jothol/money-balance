import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { Expense } from '@/types/Expense';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'expenses'),
      (snapshot) => {
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
        setLoading(false);
      },
      (err) => {
        console.error('Failed to listen to expenses:', err);
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return {
    expenses,
    loading,
    error,
    getShared: (user: string) =>
      expenses.filter(e => e.shared && e.user === user && e.type !== 'gift' && e.type !== 'payment'),
    getPaymentsFrom: (user: string) =>
      expenses.filter(e => e.type === 'payment' && e.from === user),
    getGiftsFrom: (user: string) =>
      expenses.filter(e => e.type === 'gift' && e.user === user),
  };
}
