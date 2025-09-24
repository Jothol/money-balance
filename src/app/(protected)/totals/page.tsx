'use client'

import { useState, useRef, useEffect } from 'react'
import TabSwitch from '@/components/TabSwitch'
import SlideTabs from '@/components/SlideTabs'
import Scale, { ScaleHandle } from '@/components/scale/Scale'
import { useExpenses } from '@/hooks/useExpenses'
import { usePairUsers } from '@/hooks/usePairUsers'

export default function TotalsPage() {
  const [selectedTab, setSelectedTab] = useState<'Balance' | 'Totals'>('Balance')
  const tabIndex = selectedTab === 'Balance' ? 0 : 1
  const scaleRef = useRef<ScaleHandle>(null)

  const { self, partner, pairId, loading: pairLoading } = usePairUsers()
  const { getShared, getPaymentsFrom, getGiftsFrom, loading: expensesLoading } = useExpenses(pairId)

  const selfEmail = self?.email ?? null
  const partnerEmail = partner?.email ?? null
  const partnerName = partner?.firstName?.trim() || (partnerEmail ? partnerEmail.split('@')[0] : 'partner')

  const directToUser = selfEmail ? [...getPaymentsFrom(selfEmail), ...getGiftsFrom(selfEmail)].reduce((s, e) => s + e.amount, 0) : 0
  const directToOther = partnerEmail ? [...getPaymentsFrom(partnerEmail), ...getGiftsFrom(partnerEmail)].reduce((s, e) => s + e.amount, 0) : 0
  const sharedByUser = selfEmail ? getShared(selfEmail).reduce((s, e) => s + e.amount, 0) : 0
  const sharedByOther = partnerEmail ? getShared(partnerEmail).reduce((s, e) => s + e.amount, 0) : 0

  useEffect(() => {
    if (pairLoading || expensesLoading || !selfEmail || !partnerEmail || !scaleRef.current) return
    scaleRef.current.setBalance(sharedByUser, sharedByOther, directToUser, directToOther)
  }, [pairLoading, expensesLoading, selfEmail, partnerEmail, sharedByUser, sharedByOther, directToUser, directToOther])

  if (pairLoading || expensesLoading || !selfEmail || !partnerEmail) {
    return <p className="text-center mt-20 text-gray-500">Loading...</p>
  }

  const balance = (sharedByOther - sharedByUser) / 2 + directToOther - directToUser

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
              <div className="flex justify-center mt-8">
                <Scale ref={scaleRef} />
              </div>

              <div className="mt-8 text-center space-y-4">
                <h2 className="text-lg font-bold">Breakdown</h2>

                <div>
                  <p>Shared by you: ${sharedByUser.toFixed(2)}</p>
                  <p>Shared by {partnerName}: ${sharedByOther.toFixed(2)}</p>
                </div>

                <div>
                  <p>Direct to you: ${directToUser.toFixed(2)}</p>
                  <p>Direct to {partnerName}: ${directToOther.toFixed(2)}</p>
                </div>

                <div className="font-semibold mt-2">
                  {balance > 0 ? (
                    <p>You owe {partnerName} ${balance.toFixed(2)}</p>
                  ) : balance < 0 ? (
                    <p>{partnerName} owes you ${Math.abs(balance).toFixed(2)}</p>
                  ) : (
                    <p>You’re even!</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex-grow relative">
            Totals content here
          </div>
        </SlideTabs>
      </div>
    </div>
  )
}
