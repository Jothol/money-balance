'use client';

import { useState, useRef, useEffect } from 'react';
import TabSwitch from '@/components/TabSwitch';
import SlideTabs from '@/components/SlideTabs';
import Scale, { ScaleHandle } from '@/components/scale/Scale';

export default function HomePage() {
  const [selectedTab, setSelectedTab] = useState<'Balance' | 'Totals'>('Balance');
  const tabIndex = selectedTab === 'Balance' ? 0 : 1;

  const scaleRef = useRef<ScaleHandle>(null);

  const [share1, setShare1] = useState(0);
  const [share2, setShare2] = useState(0);
  const [direct1, setDirect1] = useState(0);
  const [direct2, setDirect2] = useState(0);

  // Call setBalance whenever inputs change
  useEffect(() => {
    if (scaleRef.current) {
      scaleRef.current.setBalance(share1, share2, direct1, direct2);
    }
  }, [share1, share2, direct1, direct2]);

  return (
    <div className="flex flex-col flex-grow w-full h-full px-4 pb-4">
      <TabSwitch
        options={['Balance', 'Totals']}
        selected={selectedTab}
        onSelect={(tab) => setSelectedTab(tab as 'Balance' | 'Totals')}
      />

      <div className="mt-4 flex-grow relative">
        <SlideTabs index={tabIndex}>
          <div className='mt-4 flex-grow relative border border-red-600'>
            <div className="p-4 space-y-6">
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    <div>
                      <label className="text-sm font-medium block">Share 1</label>
                      <input
                        type="number"
                        value={share1}
                        onChange={(e) => setShare1(Number(e.target.value))}
                        className="w-full border border-gray-300 px-2 py-1 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block">Share 2</label>
                      <input
                        type="number"
                        value={share2}
                        onChange={(e) => setShare2(Number(e.target.value))}
                        className="w-full border border-gray-300 px-2 py-1 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block">Direct 1</label>
                      <input
                        type="number"
                        value={direct1}
                        onChange={(e) => setDirect1(Number(e.target.value))}
                        className="w-full border border-gray-300 px-2 py-1 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block">Direct 2</label>
                      <input
                        type="number"
                        value={direct2}
                        onChange={(e) => setDirect2(Number(e.target.value))}
                        className="w-full border border-gray-300 px-2 py-1 rounded"
                      />
                    </div>
                  </div>

                  <div className="flex justify-center mt-8">
                    <Scale ref={scaleRef} />
                  </div>
                </div>
          </div>
          <div className='mt-4 flex-grow relative border border-red-600'>Totals content here</div>
        </SlideTabs>
      </div>
    </div>
  );
}
