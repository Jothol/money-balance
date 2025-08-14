'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/firebase/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  collection, doc, getDoc, getDocs, limit, query,
  serverTimestamp, setDoc, updateDoc, where
} from 'firebase/firestore';

type PairMember = { uid?: string; email?: string; displayName?: string };
interface PairDoc {
  code: string;
  members?: PairMember[];
  memberEmails?: string[];
}
const norm = (e: string) => e.trim().toLowerCase();

export default function DebugPage() {
  const [user, setUser] = useState<User | null>(null);
  const [active, setActive] = useState<{ exists: boolean; pairId?: string } | null>(null);
  const [pair, setPair] = useState<(PairDoc & { id: string }) | null>(null);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setActive(null);
      setPair(null);
      if (!u) return;

      const aRef = doc(db, 'users', u.uid, 'pairs', '_active');
      const aSnap = await getDoc(aRef);
      if (aSnap.exists()) {
        const data = aSnap.data() as { pairId?: string };
        setActive({ exists: true, pairId: data.pairId });
        if (data.pairId) {
          const pSnap = await getDoc(doc(db, 'pairs', data.pairId));
          if (pSnap.exists()) setPair({ id: pSnap.id, ...(pSnap.data() as PairDoc) });
        }
      } else {
        setActive({ exists: false });
      }
    });
  }, []);

  async function setActiveFromCode() {
    if (!user) { setMsg('Sign in first.'); return; }
    const c = code.trim();
    if (!c) { setMsg('Enter your join code.'); return; }

    setBusy(true);
    setMsg('');
    try {
      const qy = query(collection(db, 'pairs'), where('code', '==', c), limit(1));
      const snap = await getDocs(qy);
      if (snap.empty) { setMsg('No pair found for that code.'); return; }
      const pairDoc = snap.docs[0];
      const data = pairDoc.data() as PairDoc;

      const fromMembers = (data.members ?? [])
        .map(m => (m.email ? norm(m.email) : ''))
        .filter(Boolean);
      const memberEmails = Array.from(new Set([...(data.memberEmails ?? []), ...fromMembers]));
      if (memberEmails.length > 0) {
        await updateDoc(pairDoc.ref, { memberEmails });
      }

      await setDoc(
        doc(db, 'users', user.uid, 'pairs', '_active'),
        { pairId: pairDoc.id, createdAt: serverTimestamp() }
      );

      const aSnap = await getDoc(doc(db, 'users', user.uid, 'pairs', '_active'));
      setActive(aSnap.exists() ? { exists: true, pairId: (aSnap.data() as { pairId?: string }).pairId } : { exists: false });
      const pSnap = await getDoc(doc(db, 'pairs', pairDoc.id));
      if (pSnap.exists()) setPair({ id: pSnap.id, ...(pSnap.data() as PairDoc) });

      setMsg(`Linked to pairId ${pairDoc.id}. You’re set!`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold">Pair Debug</h1>

      <div><b>UID:</b> {user?.uid ?? 'Not signed in'}</div>
      <div><b>Email:</b> {user?.email ?? '-'}</div>

      <div>
        {/* Use {"{uid}"} to render literal braces */}
        <h2 className="font-semibold mt-2">users/{'{uid}'}/pairs/_active</h2>
        <pre className="bg-gray-100 p-2 rounded text-sm">
{JSON.stringify(active, null, 2)}
        </pre>
      </div>

      <div>
        {/* Show the actual pairId if present */}
        <h2 className="font-semibold mt-2">pairs/{active?.pairId ?? '(none)'}</h2>
        <pre className="bg-gray-100 p-2 rounded text-sm">
{JSON.stringify(pair, null, 2)}
        </pre>
      </div>

      <div className="border-t pt-3">
        <label className="block text-sm">Join code</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. K3GY4AN"
          className="w-full rounded border px-3 py-2"
        />
        <button
          onClick={setActiveFromCode}
          disabled={busy}
          className="mt-2 rounded bg-blue-600/80 px-4 py-2 text-white disabled:opacity-50"
        >
          {busy ? 'Setting…' : 'Set my _active from code'}
        </button>
        {msg && <p className="text-sm mt-2">{msg}</p>}
      </div>

      <p className="text-xs text-gray-500">Delete this page when you’re done.</p>
    </div>
  );
}
