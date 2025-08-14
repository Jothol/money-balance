// hooks/usePair.ts
'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/firebase/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot, type FirestoreDataConverter, Timestamp } from 'firebase/firestore';
import type { Pair, PairIndex, PairMember } from '@/types/Pair';

const pairIndexConverter: FirestoreDataConverter<PairIndex> = {
  toFirestore: (pi) => ({ pairId: pi.pairId, createdAt: pi.createdAt }),
  fromFirestore: (snap, options) => {
    const d = snap.data(options);
    return {
      pairId: String(d.pairId ?? ''),
      createdAt: (d.createdAt ?? Timestamp.now()) as Timestamp,
    };
  },
};

const pairConverter: FirestoreDataConverter<Pair> = {
  toFirestore: (p) => ({
    code: p.code,
    members: p.members,
    memberEmails: p.memberEmails,
    createdAt: p.createdAt,
  }),
  fromFirestore: (snap, options) => {
    const d = snap.data(options);
    return {
      id: snap.id,
      code: String(d.code ?? ''),
      members: Array.isArray(d.members) ? (d.members as PairMember[]) : [],
      memberEmails: Array.isArray(d.memberEmails) ? (d.memberEmails as string[]) : [],
      createdAt: (d.createdAt ?? Timestamp.now()) as Timestamp,
    };
  },
};

export interface UsePairResult {
  pairId: string | null;
  members: PairMember[] | null;
  partner: PairMember | null;
  loading: boolean;
}

export function usePair(): UsePairResult {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [pairId, setPairId] = useState<string | null>(null);
  const [members, setMembers] = useState<PairMember[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => setUser(u));
    return () => off();
  }, []);

  // subscribe to users/{uid}/pairs/_active for pairId
  useEffect(() => {
    if (!user) {
      setPairId(null);
      setMembers(null);
      setLoading(false);
      return;
    }
    const idxRef = doc(db, 'users', user.uid, 'pairs', '_active').withConverter(pairIndexConverter);
    const off = onSnapshot(idxRef, (snap) => {
      const idx = snap.data() ?? null;
      const pid = idx?.pairId || null;
      setPairId(pid);
      if (!pid) setMembers(null);
      setLoading(false);
    });
    return () => off();
  }, [user]);

  // subscribe to pairs/{pairId} for members
  useEffect(() => {
    if (!pairId) return;
    const pairRef = doc(db, 'pairs', pairId).withConverter(pairConverter);
    const off = onSnapshot(pairRef, (snap) => {
      const data = snap.data() ?? null;
      setMembers(data?.members ?? null);
    });
    return () => off();
  }, [pairId]);

  const lower = (s?: string | null) => (s ?? '').toLowerCase();

  // partner: prefer uid comparison; if uid missing in member docs, fall back to email
  const partner =
    members && user
      ? members.find((m) => (m.uid ? m.uid !== user.uid : lower(m.email) !== lower(user.email))) ?? null
      : null;

  return { pairId, members, partner, loading };
}
