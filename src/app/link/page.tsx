'use client';

import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/firebase/firebase'

export default function LinkPage() {
    const router = useRouter()

    const handleLogout = async () => {
        try {
          await signOut(auth)
        } finally {
          if (typeof window !== 'undefined') localStorage.removeItem('activePairId')
          router.replace('/')
        }
      }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">Link page</div>
      <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-sm">
        Log out
      </button>
    </main>
  );
}
