import { useEffect, useState } from 'react';
import { auth } from '@/firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function useUserEmail() {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setEmail(user?.email ?? '');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { email, loading };
}
