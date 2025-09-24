import { collection, doc, getDoc, getDocs, query, setDoc, where, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/firebase'
import { PairDoc } from '@/types/Pair'

const pairsCol = () => collection(db, 'pairs')

export function canonicalPairId(a: string, b: string) {
  return [a, b].sort((x, y) => (x < y ? -1 : 1)).join('_')
}

export async function upsertPair(uidA: string, uidB: string) {
  const id = canonicalPairId(uidA, uidB)
  const [u1, u2] = id.split('_')
  await setDoc(doc(db, 'pairs', id), { members: [u1, u2], createdAt: serverTimestamp() }, { merge: true })
  return id
}

export async function getPair(uidA: string, uidB: string): Promise<{ id: string; data: PairDoc } | null> {
  const id = canonicalPairId(uidA, uidB)
  const snap = await getDoc(doc(db, 'pairs', id))
  if (!snap.exists()) return null
  return { id: snap.id, data: snap.data() as PairDoc }
}

export async function listPairsForUser(uid: string): Promise<Array<{ id: string; data: PairDoc }>> {
  const r = await getDocs(query(pairsCol(), where('members', 'array-contains', uid)))
  return r.docs.map(d => ({ id: d.id, data: d.data() as PairDoc }))
}
