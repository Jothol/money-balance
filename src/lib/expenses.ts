// lib/expenses.ts
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { toDayId, toWeekId, toMonthId } from '@/lib/period';

export type PurchaseKind = 'shared' | 'personal' | 'private' | 'gift';

export interface AddPurchaseInput {
  amount: number;
  description: string;
  kind: PurchaseKind;
  userEmail: string;
  pairId: string;
  partnerEmail?: string;
}

export async function addPurchase(input: AddPurchaseInput) {
  const { amount, description, kind, userEmail, pairId, partnerEmail } = input;
  const now = new Date();
  const purchaseType: 'purchase' | 'gift' = kind === 'gift' ? 'gift' : 'purchase';

  const base = {
    user: userEmail.toLowerCase(),
    amount,
    description,
    date: toDayId(now),
    day: toDayId(now),
    week: toWeekId(now),
    month: toMonthId(now),
    shared: kind === 'shared',
    isPrivate: kind === 'private',
    archived: false,
    type: purchaseType,
    createdAt: serverTimestamp(),
    pairId,
  };

  const docData =
    kind === 'gift' && partnerEmail
      ? { ...base, to: partnerEmail.toLowerCase() }
      : base;

  await addDoc(collection(db, 'expenses'), docData);
}

export interface SendPaymentInput {
  amount: number;
  fromEmail: string;
  toEmail: string;
  pairId: string;
}

export async function sendPayment({ amount, fromEmail, toEmail, pairId }: SendPaymentInput) {
  const now = new Date();

  const doc = {
    type: 'payment',
    from: fromEmail.toLowerCase(),
    to: toEmail.toLowerCase(),
    amount,
    shared: true,
    isPrivate: false,
    date: toDayId(now),
    day: toDayId(now),
    week: toWeekId(now),
    month: toMonthId(now),
    archived: false,
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
