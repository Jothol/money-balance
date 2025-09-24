'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import TabSwitch from '@/components/TabSwitch'
import SlideTabs from '@/components/SlideTabs'
import Scale, { ScaleHandle } from '@/components/scale/Scale'
import { usePairUsers } from '@/hooks/usePairUsers'
import { useExpenses } from '@/hooks/useExpensesStore'
import ReadyGate from '@/components/ReadyGate'

export default function TotalsPage() {
  const [selectedTab, setSelectedTab] = useState<'Balance' | 'Totals'>('Balance')
  const tabIndex = selectedTab === 'Balance' ? 0 : 1
  const scaleRef = useRef<ScaleHandle>(null)

  const { self, partner } = usePairUsers()
  const { state } = useExpenses()

  const selfEmailLower = (self?.emailLower ?? self?.email ?? '').toLowerCase()
  const partnerEmailLower = (partner?.emailLower ?? partner?.email ?? '').toLowerCase()
  const partnerName = (partner?.firstName?.trim() || (partnerEmailLower ? partnerEmailLower.split('@')[0] : 'partner'))

  const sharedByUser = useMemo(
    () => state.items.filter(e => e.type === 'purchase' && e.shared === true && e.user === selfEmailLower).reduce((s, e) => s + e.amount, 0),
    [state.items, selfEmailLower]
  )
  const sharedByOther = useMemo(
    () => state.items.filter(e => e.type === 'purchase' && e.shared === true && e.user === partnerEmailLower).reduce((s, e) => s + e.amount, 0),
    [state.items, partnerEmailLower]
  )
  const directToUser = useMemo(() => {
    const payments = state.items.filter(e => e.type === 'payment' && e.from === selfEmailLower).reduce((s, e) => s + e.amount, 0)
    const gifts = state.items.filter(e => e.type === 'gift' && e.user === selfEmailLower).reduce((s, e) => s + e.amount, 0)
    return payments + gifts
  }, [state.items, selfEmailLower])
  const directToOther = useMemo(() => {
    const payments = state.items.filter(e => e.type === 'payment' && e.from === partnerEmailLower).reduce((s, e) => s + e.amount, 0)
    const gifts = state.items.filter(e => e.type === 'gift' && e.user === partnerEmailLower).reduce((s, e) => s + e.amount, 0)
    return payments + gifts
  }, [state.items, partnerEmailLower])

  useEffect(() => {
    if (!scaleRef.current) return
    if (!selfEmailLower || !partnerEmailLower) return
    scaleRef.current.setBalance(sharedByUser, sharedByOther, directToUser, directToOther)
  }, [selfEmailLower, partnerEmailLower, sharedByUser, sharedByOther, directToUser, directToOther])

  const balance = (sharedByOther - sharedByUser) / 2 + directToOther - directToUser

  return (
    <ReadyGate>
      <div className="flex flex-col flex-1 min-h-0 w-full h-full px-4 pb-4">
        <TabSwitch
          options={['Balance', 'Totals']}
          selected={selectedTab}
          onSelect={(tab) => setSelectedTab(tab as 'Balance' | 'Totals')}
        />
        <div className="mt-4 flex-1 min-h-0">
          <SlideTabs index={tabIndex}>
            <div className="h-full">
              <div className="p-4 space-y-6 h-full overflow-y-auto">
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
            <div className="h-full">
              <div className="p-4">Totals content here</div>
            </div>
          </SlideTabs>
        </div>
      </div>
    </ReadyGate>
  )
}
