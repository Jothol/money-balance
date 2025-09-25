'use client';

import { useEffect, useMemo, useState } from 'react';
import { db } from '@/firebase/firebase';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ReactNode } from 'react';

type ExpenseType = 'purchase' | 'payment' | 'gift';
type Selection = 'shared' | 'personal' | 'private' | 'gift';

interface ExpenseFormProps {
  pairId: string;
  selfEmailLower: string;
  partnerEmailLower: string;
  partnerName: string;
  onSaved?: () => void;
}

function localDateYYYYMMDD(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function PillButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative h-10 rounded-full bg-white backdrop-blur overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.15)] p-[2px] text-sm font-bold"
    >
      <span
        className={`flex h-full w-full items-center justify-center rounded-full px-4 transition-colors duration-300 ease-in-out ${
          active ? 'bg-darkBrand text-white' : 'bg-transparent text-black/70'
        }`}
      >
        {children}
      </span>
    </button>
  );
}

export default function ExpenseForm({ pairId, selfEmailLower, partnerEmailLower, partnerName, onSaved }: ExpenseFormProps) {
  const [selection, setSelection] = useState<Selection>('shared');

  const [expAmount, setExpAmount] = useState<number>(0);
  const [expDesc, setExpDesc] = useState<string>('');
  const [savingExpense, setSavingExpense] = useState<boolean>(false);
  const [expMsg, setExpMsg] = useState<string>('');

  const [payAmount, setPayAmount] = useState<number>(0);
  const [savingPayment, setSavingPayment] = useState<boolean>(false);
  const [payMsg, setPayMsg] = useState<string>('');

  const canSaveExpense = useMemo(() => expAmount > 0 && pairId.length > 0, [expAmount, pairId]);
  const canSendPayment = useMemo(() => payAmount > 0 && pairId.length > 0, [payAmount, pairId]);

  useEffect(() => {
    setExpMsg('');
    setPayMsg('');
  }, [selection]);

  const saveExpense = async () => {
    if (!canSaveExpense) return;
    setSavingExpense(true);
    setExpMsg('');
    try {
      const colRef = collection(db, 'expenses');
      const newRef = doc(colRef);
      const today = localDateYYYYMMDD();

      if (selection === 'gift') {
        await setDoc(newRef, {
          id: newRef.id,
          pairId,
          user: selfEmailLower,
          amount: expAmount,
          description: expDesc || '',
          date: today,
          createdAt: serverTimestamp(),
          shared: false,
          isPrivate: false,
          type: 'gift' as ExpenseType,
        });
      } else {
        const shared = selection === 'shared';
        const isPrivate = selection === 'private';
        await setDoc(newRef, {
          id: newRef.id,
          pairId,
          user: selfEmailLower,
          amount: expAmount,
          description: expDesc || '',
          date: today,
          createdAt: serverTimestamp(),
          shared,
          isPrivate,
          type: 'purchase' as ExpenseType,
        });
      }

      setExpAmount(0);
      setExpDesc('');
      setExpMsg('Saved');
      if (onSaved) onSaved();
    } catch {
      setExpMsg('Failed to save');
    } finally {
      setSavingExpense(false);
    }
  };

  const sendPayment = async () => {
    if (!canSendPayment) return;
    setSavingPayment(true);
    setPayMsg('');
    try {
      const colRef = collection(db, 'expenses');
      const newRef = doc(colRef);
      const today = localDateYYYYMMDD();
      await setDoc(newRef, {
        id: newRef.id,
        pairId,
        from: selfEmailLower,
        to: partnerEmailLower,
        amount: payAmount,
        date: today,
        createdAt: serverTimestamp(),
        shared: true,
        isPrivate: false,
        type: 'payment' as ExpenseType,
      });
      setPayAmount(0);
      setPayMsg('Payment sent');
      if (onSaved) onSaved();
    } catch {
      setPayMsg('Failed to send');
    } finally {
      setSavingPayment(false);
    }
  };

  const labelForGift = `For ${partnerName || 'Partner'}`;

  return (
    <div className="w-full max-w-sm mx-auto space-y-8">
      <div className="grid grid-cols-4 gap-2">
        <PillButton active={selection === 'shared'} onClick={() => setSelection('shared')}>Shared</PillButton>
        <PillButton active={selection === 'personal'} onClick={() => setSelection('personal')}>Personal</PillButton>
        <PillButton active={selection === 'private'} onClick={() => setSelection('private')}>Private</PillButton>
        <PillButton active={selection === 'gift'} onClick={() => setSelection('gift')}>{labelForGift}</PillButton>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-semibold">Add Expense</h2>
        <div>
          <label className="text-sm font-medium block">Amount</label>
          <input
            type="number"
            step="0.01"
            value={expAmount}
            onChange={(e) => setExpAmount(Number(e.target.value))}
            className="w-full border border-gray-300 px-3 py-2 rounded"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="text-sm font-medium block">Description</label>
          <input
            type="text"
            value={expDesc}
            onChange={(e) => setExpDesc(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded"
            placeholder="Optional"
          />
        </div>

        <button
          type="button"
          disabled={!canSaveExpense || savingExpense}
          onClick={saveExpense}
          className="w-full h-11 rounded-full bg-darkBrand text-white font-semibold disabled:opacity-60"
        >
          {savingExpense ? 'Saving…' : 'Save Expense'}
        </button>

        {expMsg && <div className="text-sm text-gray-600">{expMsg}</div>}
      </div>

      <div className="h-px bg-gray-200" />

      <div className="space-y-4">
        <h2 className="text-base font-semibold">Send Payment</h2>
        <div>
          <label className="text-sm font-medium block">Amount</label>
          <input
            type="number"
            step="0.01"
            value={payAmount}
            onChange={(e) => setPayAmount(Number(e.target.value))}
            className="w-full border border-gray-300 px-3 py-2 rounded"
            placeholder="0.00"
          />
        </div>
        <button
          type="button"
          disabled={!canSendPayment || savingPayment}
          onClick={sendPayment}
          className="w-full h-11 rounded-full bg-darkBrand text-white font-semibold disabled:opacity-60"
        >
          {savingPayment ? 'Sending…' : `Send to ${partnerName || 'Partner'}`}
        </button>
        {payMsg && <div className="text-sm text-gray-600">{payMsg}</div>}
      </div>
    </div>
  );
}
