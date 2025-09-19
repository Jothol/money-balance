'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase/firebase';

export default function TopBar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      if (typeof window !== 'undefined') localStorage.removeItem('activePairId');
      router.replace('/');
    }
  };

  return (
    <header className="w-full h-20 bg-gradient-to-b from-blue-700 to-blue-300 flex items-center justify-between px-4 text-lg font-bold">
      <button
        onClick={handleLogout}
        className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-sm"
      >
        Log out
      </button>
    </header>
  );
}
