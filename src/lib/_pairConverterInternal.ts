// Re-export the converter for hooks without importing the entire pairs service
import type { FirestoreDataConverter } from 'firebase/firestore';
import type { Pair } from '@/types/Pair';
import { Timestamp } from 'firebase/firestore';

export const pairConverter: FirestoreDataConverter<Pair> = {
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
      members: Array.isArray(d.members) ? d.members : [],
      memberEmails: Array.isArray(d.memberEmails) ? d.memberEmails : [],
      createdAt: (d.createdAt ?? Timestamp.now()) as Timestamp,
    };
  },
};
