'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (u) router.replace('/');
      else setInitializing(false);
    });
    return () => unsub();
  }, [router]);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/');
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
        {error && <p className="text-center text-red-400 text-sm">{error}</p>}
      </div>
    </main>
  );
}
