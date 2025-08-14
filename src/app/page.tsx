'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import TabSwitch from '@/components/TabSwitch';
import SlideTabs from '@/components/SlideTabs';
import Scale, { ScaleHandle } from '@/components/scale/Scale';
import { useExpenses } from '@/hooks/useExpenses';
import { useUserEmail } from '@/hooks/useUser';
import { usePair } from '@/hooks/usePair';

const lower = (s?: string | null) => (s ?? '').toLowerCase();

export default function HomePage() {
  const [selectedTab, setSelectedTab] = useState<'Balance' | 'Totals'>('Balance');
  const tabIndex = selectedTab === 'Balance' ? 0 : 1;

  const scaleRef = useRef<ScaleHandle>(null);

  const { email, loading: userLoading } = useUserEmail();
  const { pairId, partner, loading: pairLoading } = usePair();

  // Pair-scoped expenses (no reads until pairId exists)
  const { getShared, getPaymentsFrom, getGiftsFrom, loading: expensesLoading, error } = useExpenses(pairId);

  // Normalize emails for comparisons
  const myEmail = lower(email);
  const partnerEmail = lower(partner?.email);

  // sums (guard each side)
  const directToUser =
    myEmail ? [...getPaymentsFrom(myEmail), ...getGiftsFrom(myEmail)].reduce((sum, e) => sum + e.amount, 0) : 0;

  const directToOther =
    partnerEmail ? [...getPaymentsFrom(partnerEmail), ...getGiftsFrom(partnerEmail)].reduce((sum, e) => sum + e.amount, 0) : 0;

  const sharedByUser = myEmail ? getShared(myEmail).reduce((sum, e) => sum + e.amount, 0) : 0;

  const sharedByOther = partnerEmail ? getShared(partnerEmail).reduce((sum, e) => sum + e.amount, 0) : 0;

  // update the scale when data settles
  useEffect(() => {
    if (userLoading || pairLoading || expensesLoading || !email || !scaleRef.current) return;
    scaleRef.current.setBalance(sharedByUser, sharedByOther, directToUser, directToOther);
  }, [
    userLoading,
    pairLoading,
    expensesLoading,
    email,
    sharedByUser,
    sharedByOther,
    directToUser,
    directToOther,
  ]);

  if (userLoading || pairLoading) {
    return <p className="text-center mt-20 text-gray-500">Loading…</p>;
  }

  // Not paired yet → helpful nudge
  if (!pairId) {
    return (
      <div className="p-6 text-center space-y-3">
        <h2 className="text-lg font-semibold">Welcome!</h2>
        <p className="text-gray-600">
          You’re not in a pair yet. <Link href="/pair" className="underline">Create or join a pair</Link> to start tracking expenses.
        </p>
      </div>
    );
  }

  // balance formula unchanged
  const balance = (sharedByOther - sharedByUser) / 2 + directToOther - directToUser;

  return (
    <div className="flex flex-col flex-grow w-full h-full px-4 pb-4">
      <TabSwitch
        options={['Balance', 'Totals']}
        selected={selectedTab}
        onSelect={(tab) => setSelectedTab(tab as 'Balance' | 'Totals')}
      />

      <div className="mt-4 flex-grow relative">
        <SlideTabs index={tabIndex}>
          {/* Balance tab */}
          <div className="mt-4 flex-grow relative">
            <div className="p-4 space-y-6">
              <div className="flex justify-center mt-8">
                <Scale ref={scaleRef} />
              </div>

              <div className="mt-8 text-center space-y-4">
                <h2 className="text-lg font-bold">Breakdown</h2>

                {expensesLoading ? (
                  <p className="text-gray-500">Loading totals…</p>
                ) : (
                  <>
                    <div>
                      <p>Shared by you: ${sharedByUser.toFixed(2)}</p>
                      <p>Shared by partner: ${sharedByOther.toFixed(2)}</p>
                    </div>

                    <div>
                      <p>Direct to you: ${directToUser.toFixed(2)}</p>
                      <p>Direct to partner: ${directToOther.toFixed(2)}</p>
                    </div>

                    <div className="font-semibold mt-2">
                      {balance > 0 ? (
                        <p>You owe partner ${balance.toFixed(2)}</p>
                      ) : balance < 0 ? (
                        <p>Partner owes you ${Math.abs(balance).toFixed(2)}</p>
                      ) : (
                        <p>You’re even!</p>
                      )}
                    </div>

                    {error && (
                      <p className="text-xs text-red-600 mt-2">
                        Firestore error: {error.message}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Totals tab */}
          <div className="mt-4 flex-grow relative">
            Totals content here
          </div>
        </SlideTabs>
      </div>
    </div>
  );
}
