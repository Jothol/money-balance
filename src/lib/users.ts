import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/firebase/firebase'

export async function getUserIdByEmail(email: string) {
  const q = query(collection(db, 'users'), where('emailLower', '==', email.trim().toLowerCase()))
  const res = await getDocs(q)
  return res.empty ? null : res.docs[0].id
}
