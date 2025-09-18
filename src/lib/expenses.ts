// lib/expenses.ts
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebase';

export type PurchaseKind = 'shared' | 'personal' | 'private' | 'gift';

export interface AddPurchaseInput {
  amount: number;
  description: string;
  kind: PurchaseKind;
  userEmail: string;
  pairId: string;
  partnerEmail?: string; // for gifts
}

export async function addPurchase(input: AddPurchaseInput) {
  const { amount, description, kind, userEmail, pairId, partnerEmail } = input;
  const base = {
    user: userEmail,
    amount,
    description,
    date: new Date().toISOString().slice(0, 10),
    shared: kind === 'shared',
    isPrivate: kind === 'private',
    type: kind === 'gift' ? 'gift' : 'purchase' as const,
    createdAt: serverTimestamp(),
    pairId,
  };
  const docData = kind === 'gift' && partnerEmail ? { ...base, to: partnerEmail } : base;
  await addDoc(collection(db, 'expenses'), docData);
}

export interface SendPaymentInput {
  amount: number;
  fromEmail: string;
  toEmail: string;
  pairId: string;
}

export async function sendPayment({ amount, fromEmail, toEmail, pairId }: SendPaymentInput) {
  const doc = {
    type: 'payment' as const,
    from: fromEmail,
    to: toEmail,
    amount,
    shared: true,
    isPrivate: false,
    date: new Date().toISOString().slice(0, 10),
    createdAt: serverTimestamp(),
    pairId,
  };
  await addDoc(collection(db, 'expenses'), doc);
}

export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/[, ]+/g, '');
  const val = Number(cleaned);
  if (!Number.isFinite(val) || val <= 0) return null;
  return Math.round(val * 100) / 100;
}
