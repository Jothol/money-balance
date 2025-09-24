'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, DollarSign, BookOpen, BarChart3 } from 'lucide-react';

const tabs = [
  { name: 'Home', icon: Home, path: '/totals' },
  { name: 'Pay', icon: DollarSign, path: '/pay' },
  { name: 'Logs', icon: BookOpen, path: '/logs' },
  { name: 'Stats', icon: BarChart3, path: '/stats' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="w-full z-10 h-16 shadow-[0_8px_16px_rgba(0,0,0,0.5)] flex items-center justify-around bg-white">
      {tabs.map(({ name, icon: Icon, path }) => (
        <button
          key={name}
          onClick={() => router.push(path)}
          className={`flex flex-col items-center text-xs ${
            pathname === path ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <Icon className="h-5 w-5" />
          {name}
        </button>
      ))}
    </nav>
  );
}
