'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase/firebase';
import { hasPair } from '@/lib/hasPair';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [initializing, setInitializing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) {
        setInitializing(false);
        return;
      }
      if (handled.current) return;
      handled.current = true;
      const ok = await hasPair(u.uid);
      router.replace(ok ? '/totals' : '/link');
    });
    return () => unsub();
  }, [router]);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      handled.current = true;
      const ok = await hasPair(cred.user.uid);
      router.replace(ok ? '/totals' : '/link');
    } catch (e) {
      const code = (e as { code?: string }).code ?? '';
      setError(code === 'auth/invalid-credential' ? 'Invalid email or password' : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (initializing) return null;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-center text-xl font-semibold">Log in</h1>
        <input
          className="w-full p-3 rounded-lg bg-zinc-900 text-white"
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="w-full p-3 rounded-lg bg-zinc-900 text-white"
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button
          onClick={submit}
          disabled={submitting || !email || !password}
          className="w-full p-3 rounded-lg bg-blue-600 text-white"
        >
          {submitting ? 'Loading...' : 'Log in'}
        </button>
        <button
          onClick={() => router.push('/create-account')}
          className="w-full p-3 rounded-lg bg-zinc-800 text-white"
        >
          Create account
        </button>
        {error && <p className="text-center text-red-400 text-sm">{error}</p>}
      </div>
    </main>
  );
}
