'use client';

import { useState } from 'react';
import TabSwitch from '@/components/TabSwitch';
import SlideTabs from '@/components/SlideTabs';

const tabOptions = ['Shared', 'Personal', 'Private'] as const;
type TabKey = (typeof tabOptions)[number];

export default function LogsPage() {
  const [selectedTab, setSelectedTab] = useState<TabKey>('Shared');

  const index = tabOptions.indexOf(selectedTab);

  return (
    <div className="flex flex-col flex-grow w-full h-full px-4 pb-4">

      <TabSwitch
        options={[...tabOptions]} // ✅ convert to mutable string[]
        selected={selectedTab}
        onSelect={(tab) => setSelectedTab(tab as TabKey)}
      />

      <div className="mt-4 flex-grow relative">
        <SlideTabs index={index}>
          <div className='mt-4 flex-grow relative border border-red-600'>Shared content here</div>
          <div className='mt-4 flex-grow relative border border-red-600'>Personal content here</div>
          <div className='mt-4 flex-grow relative border border-red-600'>Private content here</div>
        </SlideTabs>
      </div>
    </div>
  );
}
