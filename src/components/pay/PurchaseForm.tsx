'use client';

import { useState } from 'react';
import { useUserEmail } from '@/hooks/useUser';
import { usePair } from '@/hooks/usePair';
import { addPurchase, parseMoney } from '@/lib/expenses';
import Link from 'next/link';

type Kind = 'shared' | 'personal' | 'private' | 'gift';

export default function PurchaseForm() {
  const { email, loading: loadingUser } = useUserEmail();
  const { pairId, partner, loading: loadingPair } = usePair();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<Kind>('shared');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loading = loadingUser || loadingPair;

  const otherName =
    partner?.displayName ||
    (partner?.email ? partner.email.split('@')[0] : 'Partner');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (loading) return;
    if (!email) {
      setError('You must be signed in to add an expense.');
      return;
    }
    if (!pairId) {
      setError('You need to join or create a pair before adding expenses.');
      return;
    }

    const parsed = parseMoney(amount);
    if (parsed === null) {
      setError('Enter a valid amount greater than 0.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    setBusy(true);
    try {
      await addPurchase({
        amount: parsed,
        description: description.trim(),
        kind,
        userEmail: email,
        pairId,
        // only used for gifts; harmless otherwise
        partnerEmail: partner?.email,
      });

      setAmount('');
      setDescription('');
      setKind('shared');
    } catch (err) {
      console.error(err);
      setError('Failed to add expense.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <h2 className="text-lg font-semibold">Add Purchase</h2>

      {!loading && !pairId && (
        <p className="text-sm text-amber-600">
          You don’t have a pair yet. <Link href="/pair" className="underline">Create or join one</Link>.
        </p>
      )}

      <input
        type="text"
        inputMode="decimal"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2"
      />

      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2"
      />

      <fieldset className="space-y-2">
        <legend className="font-medium">Expense Type</legend>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {(['shared', 'personal', 'private', 'gift'] as Kind[]).map((k) => (
            <label key={k} className="flex items-center gap-2">
              <input
                type="radio"
                name="kind"
                value={k}
                checked={kind === k}
                onChange={() => setKind(k)}
              />
              <span>
                {k === 'gift' ? `For ${otherName}` : k[0].toUpperCase() + k.slice(1)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={busy || loading}
        className="rounded bg-blue-600/80 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {busy ? 'Adding…' : 'Add Expense'}
      </button>
    </form>
  );
}
