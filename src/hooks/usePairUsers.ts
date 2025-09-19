'use client'

import { useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/firebase/firebase'
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore'
import { db } from '@/firebase/firebase'
import { UserDoc } from '@/types/User'
import { PairDoc } from '@/types/Pair'

type PairLegacy = { user1Id?: string; user2Id?: string }

export function usePairUsers() {
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [selfUid, setSelfUid] = useState<string | null>(null)
  const [pairId, setPairId] = useState<string | null>(null)
  const [partnerUid, setPartnerUid] = useState<string | null>(null)
  const [self, setSelf] = useState<UserDoc | null>(null)
  const [partner, setPartner] = useState<UserDoc | null>(null)
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
    async function resolvePreferredPair(uid: string) {
      const local = typeof window !== 'undefined' ? localStorage.getItem('activePairId') : null
      if (local) {
        const ok = await verifyMembership(uid, local)
        if (ok) return local
      }
      const selfSnap = await getDoc(doc(db, 'users', uid))
      const active = selfSnap.exists() ? (selfSnap.data() as UserDoc).activePairId ?? null : null
      if (active) {
        const ok = await verifyMembership(uid, active)
        if (ok) return active
      }
      const found = await findFirstPair(uid)
      return found
    }

    async function verifyMembership(uid: string, pid: string) {
      const p = await getDoc(doc(db, 'pairs', pid))
      if (!p.exists()) return false
      const d = p.data() as Partial<PairDoc & PairLegacy>
      if (Array.isArray(d.members) && d.members.includes(uid)) return true
      if ((d.user1Id === uid && d.user2Id) || (d.user2Id === uid && d.user1Id)) return true
      return false
    }

    async function findFirstPair(uid: string) {
      const col = collection(db, 'pairs')
      const rNew = await getDocs(query(col, where('members', 'array-contains', uid)))
      if (!rNew.empty) return rNew.docs[0].id
      const [r1, r2] = await Promise.all([
        getDocs(query(col, where('user1Id', '==', uid))),
        getDocs(query(col, where('user2Id', '==', uid)))
      ])
      const merged = [...r1.docs, ...r2.docs]
      if (merged.length === 0) return null
      return merged[0].id
    }

    async function load() {
      if (!authUser || !selfUid) {
        setSelf(null)
        setPartner(null)
        setPairId(null)
        setPartnerUid(null)
        setLoading(false)
        return
      }
      setLoading(true)

      const preferred = await resolvePreferredPair(selfUid)
      if (!preferred) {
        setPairId(null)
        setPartnerUid(null)
        setSelf(await readUser(selfUid, authUser))
        setPartner(null)
        setLoading(false)
        return
      }

      const partnerUidResolved = await resolvePartnerUid(selfUid, preferred)
      setPairId(preferred)
      setPartnerUid(partnerUidResolved)

      const [selfDoc, partnerDoc] = await Promise.all([readUser(selfUid, authUser), partnerUidResolved ? readUser(partnerUidResolved, null) : Promise.resolve(null)])
      if (!cancelled) {
        setSelf(selfDoc)
        setPartner(partnerDoc)
        setLoading(false)
      }
    }

    async function resolvePartnerUid(uid: string, pid: string) {
      const p = await getDoc(doc(db, 'pairs', pid))
      if (!p.exists()) return null
      const d = p.data() as Partial<PairDoc & PairLegacy>
      if (Array.isArray(d.members)) {
        const other = d.members.find(m => m !== uid) ?? null
        return other ?? null
      }
      const other = d.user1Id === uid ? String(d.user2Id ?? '') : String(d.user1Id ?? '')
      return other || null
    }

    async function readUser(uid: string, fallbackFromAuth: User | null) {
      const s = await getDoc(doc(db, 'users', uid))
      if (s.exists()) return s.data() as UserDoc
      return {
        firstName: fallbackFromAuth?.displayName?.split(' ')[0] ?? '',
        lastName: '',
        email: fallbackFromAuth?.email ?? ''
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [authUser, selfUid])

  async function setActivePair(id: string) {
    if (!selfUid) return
    if (typeof window !== 'undefined') localStorage.setItem('activePairId', id)
    try {
      await setDoc(doc(db, 'users', selfUid), { activePairId: id }, { merge: true })
    } catch {}
    setPairId(id)
  }

  return { self, partner, selfUid, partnerUid, pairId, loading, setActivePair }
}
