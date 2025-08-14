// types/Pair.ts
import type { Timestamp } from 'firebase/firestore';

export interface PairMember {
  uid: string;
  email: string;          // normalized (lowercase)
  displayName?: string;
}

export interface Pair {
  id: string;             // doc id
  code: string;           // short join code
  members: PairMember[];  // 1–2 members
  memberEmails: string[]; // normalized for easy rules/queries
  createdAt: Timestamp;   // Firestore timestamp
}

// Optional: user→pair index doc
export interface PairIndex {
  pairId: string;
  createdAt: Timestamp;   // when the index was written
}
