'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase/firebase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [initializing, setInitializing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bypassAuthListener = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) {
        setInitializing(false);
        return;
      }
      if (bypassAuthListener.current) return;
      router.replace('/totals');
    });
    return () => unsub();
  }, [router]);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      bypassAuthListener.current = true;
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/link');
    } catch (e) {
      const code = (e as { code?: string }).code ?? '';
      setError(code === 'auth/invalid-credential' ? 'Invalid email or password' : 'Login failed');
      bypassAuthListener.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  if (initializing) return null;

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-darkBrand to-whiteBrand">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-center text-xl font-semibold">Log in</h1>
        <input
          className="w-full p-3 rounded-lg bg-white/80"
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="w-full p-3 rounded-lg bg-white/80"
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button
          onClick={submit}
          disabled={submitting || !email || !password}
          className="w-full p-3 rounded-lg bg-darkBrand text-white"
        >
          {submitting ? 'Loading...' : 'Log in'}
        </button>
        <button
          onClick={() => router.push('/create-account')}
          className="w-full p-3 rounded-lg bg-brand text-white"
        >
          Create account
        </button>
        {error && <p className="text-center text-red-400 text-sm">{error}</p>}
      </div>
    </main>
  );
}
