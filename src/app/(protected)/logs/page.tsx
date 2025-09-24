'use client';

import { useState } from 'react';
import TabSwitch from '@/components/TabSwitch';
import SlideTabs from '@/components/SlideTabs';
import SharedPanel from '@/components/logs/SharedPanel';

const tabOptions = ['Shared', 'Personal', 'Private'] as const;
type TabKey = (typeof tabOptions)[number];

export default function LogsPage() {
  const [selectedTab, setSelectedTab] = useState<TabKey>('Shared');
  const index = tabOptions.indexOf(selectedTab);

  return (
    <div className="flex flex-col flex-grow w-full h-full px-4 pb-4">
      <TabSwitch
        options={[...tabOptions]}
        selected={selectedTab}
        onSelect={(tab) => setSelectedTab(tab as TabKey)}
      />
      <div className="mt-4 flex-1 min-h-0">
        <SlideTabs index={index}>
          <div className="h-full"><SharedPanel /></div>
          <div className="h-full">Personal content here</div>
          <div className="h-full">Private content here</div>
        </SlideTabs>
      </div>
    </div>
  );
}
