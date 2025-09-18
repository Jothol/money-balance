'use client';

import { useState, useMemo } from 'react';
import { usePair } from '@/hooks/usePair';
import { useUserEmail } from '@/hooks/useUser';
import { useExpenses } from '@/hooks/useExpenses';
import {
  currentPeriodId,
  labelPeriod,
  shiftPeriod,
  type PeriodKind,
} from '@/lib/period';

const lower = (s?: string | null) => (s ?? '').toLowerCase();

export default function StatsPage() {
  const { pairId, partner, loading: pairLoading } = usePair();
  const { email, loading: userLoading } = useUserEmail();

  // UI state
  const [kind, setKind] = useState<PeriodKind>('month');
  const [periodId, setPeriodId] = useState<string>(() => currentPeriodId('month'));

  // recompute periodId when switching kind
  function onKindChange(next: PeriodKind) {
    setKind(next);
    setPeriodId(currentPeriodId(next));
  }

  // data
  const { expenses, loading: expLoading } = useExpenses(pairId, {
    kind,
    periodId,
    includeArchived: false,
    orderByCreatedAtDesc: true,
  });

  const my = lower(email);
  const their = lower(partner?.email);

  const { sharedByYou, sharedByThem, directToYou, directToThem, net } = useMemo(() => {
    let sYou = 0, sThem = 0, dYou = 0, dThem = 0;

    for (const e of expenses) {
      const u = lower(e.user);
      const f = lower(e.from);
      if (e.type === 'payment') {
        if (f && f === my) dYou += e.amount;           // I sent payment => direct to partner from me
        else if (f && f === their) dThem += e.amount;  // Partner sent payment
      } else if (e.type === 'gift') {
        if (u && u === my) dYou += e.amount;           // I gifted partner
        else if (u && u === their) dThem += e.amount;  // Partner gifted me
      } else {
        // purchase
        if (e.shared) {
          if (u === my) sYou += e.amount;
          else if (u === their) sThem += e.amount;
        }
      }
    }

    const netVal = (sThem - sYou) / 2 + dThem - dYou;
    return {
      sharedByYou: sYou,
      sharedByThem: sThem,
      directToYou: dYou,
      directToThem: dThem,
      net: netVal,
    };
  }, [expenses, my, their]);

  const loading = userLoading || pairLoading || expLoading;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold">Stats</h1>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded border overflow-hidden">
          {(['day', 'week', 'month'] as PeriodKind[]).map(k => (
            <button
              key={k}
              onClick={() => onKindChange(k)}
              className={`px-3 py-1 text-sm ${k === kind ? 'bg-blue-600 text-white' : 'bg-white'}`}
            >
              {k[0].toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>

        <div className="ml-2 inline-flex items-center gap-2">
          <button
            className="px-3 py-1 rounded border"
            onClick={() => setPeriodId(id => shiftPeriod(kind, id, -1))}
          >
            ← Prev
          </button>
          <div className="text-sm font-medium">
            {labelPeriod(kind, periodId)}
          </div>
          <button
            className="px-3 py-1 rounded border"
            onClick={() => setPeriodId(id => shiftPeriod(kind, id, +1))}
          >
            Next →
          </button>
          <button
            className="px-3 py-1 rounded border"
            onClick={() => setPeriodId(currentPeriodId(kind))}
            title="Jump to current period"
          >
            Today
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Shared by you" value={sharedByYou} />
        <StatCard label="Shared by partner" value={sharedByThem} />
        <StatCard label="Direct to you" value={directToYou} />
        <StatCard label="Direct to partner" value={directToThem} />
      </div>

      <div className="font-semibold">
        {net > 0 ? (
          <p>You owe partner ${net.toFixed(2)}</p>
        ) : net < 0 ? (
          <p>Partner owes you ${Math.abs(net).toFixed(2)}</p>
        ) : (
          <p>You’re even!</p>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : expenses.length === 0 ? (
        <p className="text-gray-500">No transactions in this period.</p>
      ) : (
        <div className="overflow-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Shared?</Th>
                <Th>Who</Th>
                <Th className="text-right">Amount</Th>
                <Th>Description</Th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-t">
                  <Td>{e.date}</Td>
                  <Td>{e.type ?? 'purchase'}</Td>
                  <Td>{e.type === 'payment' ? '—' : e.shared ? 'Yes' : 'No'}</Td>
                  <Td>
                    {e.type === 'payment'
                      ? `${e.from} → ${e.to}`
                      : e.type === 'gift'
                      ? `${e.user} → ${e.to}`
                      : e.user}
                  </Td>
                  <Td className="text-right">${e.amount.toFixed(2)}</Td>
                  <Td>{e.description ?? '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border p-3 bg-white">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold">${value.toFixed(2)}</div>
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-left font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}
