'use client';

import { useMemo } from 'react';
import { usePairUsers } from '@/hooks/usePairUsers';
import { useExpenses } from '@/hooks/useExpensesStore';
import { Expense } from '@/types/Expense';

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function formatLocalDate(ymd: string) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString();
}

function groupByDate(items: Expense[]) {
  const map = new Map<string, Expense[]>();
  for (const it of items) {
    const arr = map.get(it.date) ?? [];
    arr.push(it);
    map.set(it.date, arr);
  }
  return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

export default function PrivatePanel() {
  const { self } = usePairUsers();
  const selfEmailLower = self?.emailLower ?? '';
  const { state } = useExpenses();

  const items = useMemo(
    () => state.items.filter(e => e.type === 'purchase' && e.isPrivate === true && e.user === selfEmailLower),
    [state.items, selfEmailLower]
  );

  const groups = useMemo(() => groupByDate(items), [items]);

  return (
    <div className="h-full overflow-y-auto pb-24 pr-1">
      {items.length === 0 ? (
        <div className="text-gray-600">No private purchases yet.</div>
      ) : (
        <div className="space-y-4">
          {groups.map(([date, rows]) => (
            <div key={date} className="rounded-xl p-3 bg-white/60">
              <div className="font-semibold mb-2">{formatLocalDate(date)}</div>
              <div className="space-y-2">
                {rows.map(r => (
                  <div key={r.id} className="rounded-lg px-3 py-2 bg-white text-sm">
                    <span className="opacity-60 mr-1">(Private)</span>
                    <span className="font-semibold">You</span> paid {formatMoney(r.amount)}{r.description ? ` for "${r.description}"` : ''}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
