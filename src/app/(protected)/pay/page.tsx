'use client';

import ExpenseForm from '@/components/ExpenseForm';
import { useMemo } from 'react';
import { usePairUsers } from '@/hooks/usePairUsers';

export default function PayPage() {
  const { selfEmailLower, partnerEmailLower, pairId, loading, partner } = usePairUsers();

  const ready = useMemo(() => typeof pairId === 'string' && pairId.length > 0 && !loading, [pairId, loading]);
  const ensuredPairId = useMemo(() => (typeof pairId === 'string' ? pairId : ''), [pairId]);
  const me = selfEmailLower ?? '';
  const them = partnerEmailLower ?? '';
  const partnerName = useMemo(() => {
    const name = `${partner?.firstName ?? ''} ${partner?.lastName ?? ''}`.trim();
    if (name.length > 0) return name;
    if (partner?.email && partner.email.length > 0) return partner.email.split('@')[0];
    return 'Partner';
  }, [partner]);

  return (
    <div className="w-full h-full px-4 py-6">
      <h1 className="text-lg font-semibold mb-4">Pay</h1>
      {!ready ? (
        <div className="text-gray-500">Loading…</div>
      ) : (
        <ExpenseForm
          pairId={ensuredPairId}
          selfEmailLower={me}
          partnerEmailLower={them}
          partnerName={partnerName}
          onSaved={() => {}}
        />
      )}
    </div>
  );
}
