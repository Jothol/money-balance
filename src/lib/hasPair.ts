import { db } from '@/firebase/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

export async function hasPair(uid: string) {
  const colRef = collection(db, 'pairs')
  const snapNew = await getDocs(query(colRef, where('members', 'array-contains', uid)))
  if (!snapNew.empty) return true
  const [r1, r2] = await Promise.all([
    getDocs(query(colRef, where('user1Id', '==', uid))),
    getDocs(query(colRef, where('user2Id', '==', uid)))
  ])
  return r1.size + r2.size > 0
}
