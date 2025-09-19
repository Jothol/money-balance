'use client'

import { useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/firebase/firebase'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/firebase/firebase'
import { UserDoc } from '@/types/User'
import { PairDoc } from '@/types/Pair'

type PairLegacy = { user1Id?: string; user2Id?: string }

export function usePairUsers() {
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [selfUid, setSelfUid] = useState<string | null>(null)
  const [partnerUid, setPartnerUid] = useState<string | null>(null)
  const [self, setSelf] = useState<UserDoc | null>(null)
  const [partner, setPartner] = useState<UserDoc | null>(null)
  const [pairId, setPairId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setAuthUser(u)
      setSelfUid(u?.uid ?? null)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!authUser || !selfUid) {
        setSelf(null)
        setPartner(null)
        setPartnerUid(null)
        setPairId(null)
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const pairsCol = collection(db, 'pairs')
        const snapNew = await getDocs(query(pairsCol, where('members', 'array-contains', selfUid)))
        if (!snapNew.empty) {
          const first = snapNew.docs[0]
          const data = first.data() as PairDoc
          const members = Array.isArray(data.members) ? data.members : []
          const other = members.find(m => m !== selfUid) ?? null
          setPairId(first.id)
          setPartnerUid(other)
        } else {
          const [r1, r2] = await Promise.all([
            getDocs(query(pairsCol, where('user1Id', '==', selfUid))),
            getDocs(query(pairsCol, where('user2Id', '==', selfUid)))
          ])
          const merged = [...r1.docs, ...r2.docs]
          if (merged.length > 0) {
            const first = merged[0]
            const data = first.data() as PairLegacy
            const other = data.user1Id === selfUid ? String(data.user2Id ?? '') : String(data.user1Id ?? '')
            setPairId(first.id)
            setPartnerUid(other || null)
          } else {
            setPairId(null)
            setPartnerUid(null)
          }
        }

        const selfSnap = await getDoc(doc(db, 'users', selfUid))
        const selfDoc: UserDoc | null = selfSnap.exists()
          ? (selfSnap.data() as UserDoc)
          : { firstName: authUser.displayName?.split(' ')[0] ?? '', lastName: '', email: authUser.email ?? '' }
        setSelf(selfDoc)

        if (partnerUid) {
          const pSnap = await getDoc(doc(db, 'users', partnerUid))
          const pDoc: UserDoc | null = pSnap.exists() ? (pSnap.data() as UserDoc) : null
          setPartner(pDoc)
        } else {
          setPartner(null)
        }

        if (!cancelled) setLoading(false)
      } catch {
        if (!cancelled) {
          setSelf(null)
          setPartner(null)
          setPairId(null)
          setPartnerUid(null)
          setLoading(false)
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [authUser, selfUid, partnerUid])

  return { self, partner, selfUid, partnerUid, pairId, loading }
}
