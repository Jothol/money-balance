'use client';

import { useState } from 'react';
import { useUserEmail } from '@/hooks/useUser';
import { usePair } from '@/hooks/usePair';
import { parseMoney, sendPayment } from '@/lib/expenses';
import Link from 'next/link';

export default function PaymentForm() {
  const { email, loading: loadingUser } = useUserEmail();
  const { pairId, partner, loading: loadingPair } = usePair();

  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loading = loadingUser || loadingPair;

  async function onSend() {
    setError('');

    if (loading) return;
    if (!email) {
      setError('You must be signed in to send a payment.');
      return;
    }
    if (!pairId) {
      setError('You need to join or create a pair before sending payments.');
      return;
    }
    if (!partner?.email) {
      setError('No partner found in your pair.');
      return;
    }

    const parsed = parseMoney(amount);
    if (parsed === null) {
      setError('Payment amount must be greater than 0.');
      return;
    }

    setBusy(true);
    try {
      await sendPayment({
        amount: parsed,
        fromEmail: email,
        toEmail: partner.email,
        pairId,
      });
      setAmount('');
    } catch (err) {
      console.error(err);
      setError('Failed to send payment.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Send Payment</h2>

      {!loading && !pairId && (
        <p className="text-sm text-amber-600">
          You don’t have a pair yet. <Link href="/pair" className="underline">Create or join one</Link>.
        </p>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={busy || loading}
          className="rounded bg-blue-600/80 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {busy ? 'Sending…' : 'Send'}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
