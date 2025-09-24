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

export default function SharedPanel() {
  const { self, partner, selfEmailLower, partnerEmailLower, loading } = usePairUsers();
  const { state } = useExpenses();

  const namesReady = useMemo(
    () => !loading && Boolean(self?.firstName) && Boolean(partner?.firstName),
    [loading, self?.firstName, partner?.firstName]
  );

  const items = useMemo(
    () =>
      namesReady
        ? state.items.filter(
            r => r.type === 'payment' || r.type === 'gift' || (r.type === 'purchase' && r.shared === true)
          )
        : [],
    [namesReady, state.items]
  );

  const groups = useMemo(() => (namesReady ? groupByDate(items) : []), [namesReady, items]);

  if (!namesReady) return null;

  const nameFor = (emailLower?: string) => {
    if (!emailLower) return '';
    if (emailLower === selfEmailLower) return self?.firstName || 'You';
    if (emailLower === partnerEmailLower) return partner?.firstName || 'Partner';
    return emailLower.split('@')[0];
  };

  return (
    <div className="h-full overflow-y-auto pb-24 pr-1">
      {items.length === 0 ? (
        <div className="text-gray-600">No shared purchases or payments yet.</div>
      ) : (
        <div className="space-y-4">
          {groups.map(([date, rows]) => (
            <div key={date} className="rounded-xl p-3 bg-white/60">
              <div className="font-semibold mb-2">{formatLocalDate(date)}</div>
              <div className="space-y-2">
                {rows.map(r => {
                  if (r.type === 'payment') {
                    return (
                      <div key={r.id} className="rounded-lg px-3 py-2 bg-white text-sm">
                        <span className="opacity-60 mr-1">(Payment)</span>
                        <span className="font-semibold">{nameFor(r.from)}</span> paid{' '}
                        <span className="font-semibold">{nameFor(r.to)}</span> {formatMoney(r.amount)}
                      </div>
                    );
                  }
                  if (r.type === 'gift') {
                    const actor = nameFor(r.user);
                    const target =
                      actor === (self?.firstName || 'You') ? partner?.firstName || 'Partner' : self?.firstName || 'You';
                    return (
                      <div key={r.id} className="rounded-lg px-3 py-2 bg-white text-sm">
                        <span className="opacity-60 mr-1">(For {target})</span>
                        <span className="font-semibold">{actor}</span> paid {formatMoney(r.amount)}
                        {r.description ? ` for "${r.description}"` : ''}
                      </div>
                    );
                  }
                  return (
                    <div key={r.id} className="rounded-lg px-3 py-2 bg-white text-sm">
                      <span className="opacity-60 mr-1">(Shared)</span>
                      <span className="font-semibold">{nameFor(r.user)}</span> paid {formatMoney(r.amount)}
                      {r.description ? ` for "${r.description}"` : ''}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
