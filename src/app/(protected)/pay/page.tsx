'use client';

import { useMemo } from 'react';
import { usePairUsers } from '@/hooks/usePairUsers';
import ExpenseForm from '@/components/ExpenseForm';
import { useExpenses } from '@/hooks/useExpensesStore';

export default function PayPage() {
  const { selfEmailLower, partnerEmailLower, pairId, loading, partner } = usePairUsers();
  const { loadForPair } = useExpenses();

  const ready = useMemo(() => typeof pairId === 'string' && pairId.length > 0 && !loading, [pairId, loading]);
  const ensuredPairId = useMemo(() => (typeof pairId === 'string' ? pairId : ''), [pairId]);
  const partnerName = `${partner?.firstName ?? ''}`.trim() || 'Partner';

  if (!ready) return <div className="p-4 text-gray-500">Loading…</div>;

  return (
    <div className="w-full h-full px-4 py-6">
      <h1 className="text-lg font-semibold mb-4">Pay</h1>
      <ExpenseForm
        pairId={ensuredPairId}
        selfEmailLower={selfEmailLower ?? ''}
        partnerEmailLower={partnerEmailLower ?? ''}
        partnerName={partnerName}
        onSaved={() => loadForPair(ensuredPairId, { force: true })}
      />
    </div>
  );
}
