import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/firebase/firebase'
import { Expense } from '@/types/Expense'

export function useExpenses(pairId: string | null | undefined) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    console.log("PairId: " + pairId)
    if (!pairId) {
      setExpenses([])
      setLoading(false)
      return
    }
    const q = query(collection(db, 'expenses'), where('pairId', '==', pairId))
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const data: Expense[] = snapshot.docs.map(doc => {
          const raw = doc.data() as Omit<Expense, 'id'>
          return {
            id: doc.id,
            ...raw,
            type: (raw.type as Expense['type']) ?? 'purchase',
            shared: raw.shared ?? false,
            isPrivate: raw.isPrivate ?? false,
          }
        })
        setExpenses(data)
        setLoading(false)
      },
      err => {
        setError(err as Error)
        setLoading(false)
      }
    )
    return unsubscribe
  }, [pairId])

  return {
    expenses,
    loading,
    error,
    getShared: (email: string) =>
      expenses.filter(e => e.shared && e.user === email && e.type !== 'gift' && e.type !== 'payment'),
    getPaymentsFrom: (email: string) =>
      expenses.filter(e => e.type === 'payment' && e.from === email),
    getGiftsFrom: (email: string) =>
      expenses.filter(e => e.type === 'gift' && e.user === email),
  }
}
