// lib/pairs.ts
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  FirestoreDataConverter,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import type { Pair, PairIndex, PairMember } from '@/types/Pair';

const normalize = (e: string) => e.trim().toLowerCase();
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const joinCode = (len = 7) =>
  Array.from({ length: len }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

// ----- Converters (remove `any` from snapshots) -----
const pairConverter: FirestoreDataConverter<Pair> = {
  toFirestore: (p: Pair) => ({
    code: p.code,
    members: p.members,
    memberEmails: p.memberEmails,
    createdAt: p.createdAt,
  }),
  fromFirestore: (snap, options): Pair => {
    const d = snap.data(options);
    const members = Array.isArray(d.members) ? (d.members as PairMember[]) : [];
    const memberEmails = Array.isArray(d.memberEmails) ? (d.memberEmails as string[]) : [];
    return {
      id: snap.id,
      code: String(d.code ?? ''),
      members,
      memberEmails,
      createdAt: (d.createdAt ?? Timestamp.now()) as Timestamp,
    };
  },
};

const pairIndexConverter: FirestoreDataConverter<PairIndex> = {
  toFirestore: (pi: PairIndex) => ({
    pairId: pi.pairId,
    createdAt: pi.createdAt,
  }),
  fromFirestore: (snap, options): PairIndex => {
    const d = snap.data(options);
    return {
      pairId: String(d.pairId ?? ''),
      createdAt: (d.createdAt ?? Timestamp.now()) as Timestamp,
    };
  },
};

// ----- Public API -----

export async function createPairForUser(user: { uid: string; email: string; displayName?: string }) {
  const members: PairMember[] = [{ uid: user.uid, email: normalize(user.email), displayName: user.displayName }];
  const pairsCol = collection(db, 'pairs').withConverter(pairConverter);
  const ref = await addDoc(pairsCol, {
    id: '', // ignored by converter.toFirestore
    code: joinCode(),
    members,
    memberEmails: members.map((m) => m.email),
    createdAt: serverTimestamp() as unknown as Timestamp,
  } as Pair);
  await setActivePairForUser(user.uid, ref.id);
  return { pairId: ref.id };
}

export async function joinPairByCode(code: string, user: { uid: string; email: string; displayName?: string }) {
  const pairsCol = collection(db, 'pairs').withConverter(pairConverter);
  const q = query(pairsCol, where('code', '==', code), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('Invalid join code');

  const pairDoc = snap.docs[0];
  const pair = pairDoc.data();
  const email = normalize(user.email);

  const alreadyMember = pair.memberEmails.includes(email);
  if (!alreadyMember) {
    if (pair.members.length >= 2) throw new Error('Pair already has two members');
    await updateDoc(pairDoc.ref, {
      members: arrayUnion({ uid: user.uid, email, displayName: user.displayName } as PairMember),
      memberEmails: arrayUnion(email),
    });
  }
  await setActivePairForUser(user.uid, pairDoc.id);
  return { pairId: pairDoc.id };
}

export async function setActivePairForUser(uid: string, pairId: string) {
  const idxRef = doc(db, 'users', uid, 'pairs', '_active').withConverter(pairIndexConverter);
  await setDoc(idxRef, { pairId, createdAt: serverTimestamp() as unknown as Timestamp });
}

export async function getActivePairId(uid: string) {
  const idxRef = doc(db, 'users', uid, 'pairs', '_active').withConverter(pairIndexConverter);
  const snap = await getDoc(idxRef);
  return snap.exists() ? snap.data().pairId : null;
}
