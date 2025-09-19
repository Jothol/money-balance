'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase/firebase';
import { db } from '@/firebase/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function CreateAccountPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (u) router.replace('/link');
    });
    return () => unsub();
  }, [router]);

  const submit = async () => {
    if (password !== password2) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim()
      });
      router.replace('/link');
    } catch (e) {
      const code = (e as { code?: string }).code ?? '';
      if (code === 'auth/email-already-in-use') setError('Email already in use');
      else if (code === 'auth/weak-password') setError('Password too weak');
      else setError('Sign up failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-center text-xl font-semibold">Create account</h1>
        <input
          className="w-full p-3 rounded-lg bg-zinc-900 text-white"
          placeholder="First name"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
        />
        <input
          className="w-full p-3 rounded-lg bg-zinc-900 text-white"
          placeholder="Last name"
          value={lastName}
          onChange={e => setLastName(e.target.value)}
        />
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
        <input
          className="w-full p-3 rounded-lg bg-zinc-900 text-white"
          placeholder="Confirm password"
          type="password"
          value={password2}
          onChange={e => setPassword2(e.target.value)}
        />
        <button
          onClick={submit}
          disabled={submitting || !firstName || !lastName || !email || !password || !password2}
          className="w-full p-3 rounded-lg bg-green-600 text-white"
        >
          {submitting ? 'Creating...' : 'Create account'}
        </button>
        <button
          onClick={() => router.replace('/')}
          className="w-full p-3 rounded-lg bg-zinc-800 text-white"
        >
          Back to login
        </button>
        {error && <p className="text-center text-red-400 text-sm">{error}</p>}
      </div>
    </main>
  );
}
