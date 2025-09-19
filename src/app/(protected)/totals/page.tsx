'use client';

import { useState, useRef } from 'react';
import TabSwitch from '@/components/TabSwitch';
import SlideTabs from '@/components/SlideTabs';
import Scale, { ScaleHandle } from '@/components/scale/Scale';
import { useExpenses } from '@/hooks/useExpenses';
import { useUserEmail } from '@/hooks/useUser';
import { useEffect } from 'react';

export default function TotalsPage() {
  const [selectedTab, setSelectedTab] = useState<'Balance' | 'Totals'>('Balance');
  const tabIndex = selectedTab === 'Balance' ? 0 : 1;

  const scaleRef = useRef<ScaleHandle>(null);

  const { getShared, getPaymentsFrom, getGiftsFrom, loading: expensesLoading } = useExpenses();
  const { email, loading: userLoading } = useUserEmail();

  const otherEmail = email === 'jontholsen@gmail.com' ? 'lexyrak32@gmail.com' : 'jontholsen@gmail.com';

  const directToUser = email ? [...getPaymentsFrom(email), ...getGiftsFrom(email)].reduce((sum, e) => sum + e.amount, 0) : 0;
  const directToOther = email ? [...getPaymentsFrom(otherEmail), ...getGiftsFrom(otherEmail)].reduce((sum, e) => sum + e.amount, 0) : 0;
  const sharedByUser = email ? getShared(email).reduce((sum, e) => sum + e.amount, 0) : 0;
  const sharedByOther = email ? getShared(otherEmail).reduce((sum, e) => sum + e.amount, 0) : 0;

  useEffect(() => {
    if (
      userLoading ||
      expensesLoading ||
      !email ||
      !scaleRef.current
    ) return;

    scaleRef.current.setBalance(
      sharedByUser,
      sharedByOther,
      directToUser,
      directToOther
    );
  }, [
    userLoading,
    expensesLoading,
    email,
    sharedByUser,
    sharedByOther,
    directToUser,
    directToOther,
  ]);

  if (userLoading || expensesLoading || !email) {
    return <p className="text-center mt-20 text-gray-500">Loading...</p>;
  }

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
          <div className="mt-4 flex-grow relative">
            <div className="p-4 space-y-6">
              {/* Scale */}
              <div className="flex justify-center mt-8">
                <Scale ref={scaleRef} />
              </div>

              {/* Totals and balance */}
              <div className="mt-8 text-center space-y-4">
                <h2 className="text-lg font-bold">Breakdown</h2>

                <div>
                  <p>Shared by you: ${sharedByUser.toFixed(2)}</p>
                  <p>Shared by partner: ${sharedByOther.toFixed(2)}</p>
                </div>

                <div>
                  <p>Direct to you: ${directToUser.toFixed(2)}</p>
                  <p>Direct to partner: ${directToOther.toFixed(2)}</p>
                </div>

                <div className="font-semibold mt-2">
                  {
                    balance > 0 ? (
                      <p>You owe partner ${balance.toFixed(2)}</p>
                    ) : balance < 0 ? (
                      <p>Partner owes you ${Math.abs(balance).toFixed(2)}</p>
                    ) : (
                      <p>You’re even!</p>
                    )
                  }
                </div>
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
