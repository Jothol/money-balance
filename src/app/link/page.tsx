'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebase/firebase';
import { db } from '@/firebase/firebase';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';

type UserDoc = { firstName: string; lastName: string; email: string };
type PairLegacy = { user1Id?: string; user2Id?: string };
type PartnerRow = { pairId: string; partnerUid: string; partnerName: string; partnerEmail: string };

export default function LinkPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [rows, setRows] = useState<PartnerRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) {
        router.replace('/');
        return;
      }
      setUid(u.uid);
      setReady(true);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!uid) return;
      setLoadingRows(true);
      try {
        const colRef = collection(db, 'pairs');
        const byMembers = await getDocs(query(colRef, where('members', 'array-contains', uid)));
        const [r1, r2] = await Promise.all([
          getDocs(query(colRef, where('user1Id', '==', uid))),
          getDocs(query(colRef, where('user2Id', '==', uid)))
        ]);
        const merged = new Map<string, { partnerUid: string }>();

        byMembers.docs.forEach(d => {
          const data = d.data() as { members?: string[] };
          const members = Array.isArray(data.members) ? data.members : [];
          const other = members.find(m => m !== uid);
          if (other) merged.set(d.id, { partnerUid: other });
        });

        [...r1.docs, ...r2.docs].forEach(d => {
          if (merged.has(d.id)) return;
          const data = d.data() as PairLegacy;
          const other = data.user1Id === uid ? String(data.user2Id ?? '') : String(data.user1Id ?? '');
          if (other) merged.set(d.id, { partnerUid: other });
        });

        const items: PartnerRow[] = [];
        for (const [pairId, { partnerUid }] of merged.entries()) {
          const uSnap = await getDoc(doc(db, 'users', partnerUid));
          const u = uSnap.exists() ? (uSnap.data() as UserDoc) : null;
          const name = u ? [u.firstName, u.lastName].filter(Boolean).join(' ').trim() : '';
          const fallback = u?.email ? u.email.split('@')[0] : partnerUid.slice(0, 6);
          items.push({
            pairId,
            partnerUid,
            partnerName: name || fallback,
            partnerEmail: u?.email ?? ''
          });
        }

        if (!cancelled) setRows(items.sort((a, b) => a.partnerName.localeCompare(b.partnerName)));
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoadingRows(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const handleSelect = async (pairId: string) => {
    if (!uid) return;
    if (typeof window !== 'undefined') localStorage.setItem('activePairId', pairId);
    try {
      await setDoc(doc(db, 'users', uid), { activePairId: pairId }, { merge: true });
    } catch {}
    router.replace('/totals');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      if (typeof window !== 'undefined') localStorage.removeItem('activePairId');
      router.replace('/');
    }
  };

  if (!ready) return null;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center text-xl font-semibold">Select Partner Tracker</div>
        <div className="rounded-lg bg-zinc-900 p-3 max-h-64 overflow-y-auto space-y-2">
          {loadingRows ? (
            <div className="text-zinc-400 text-center">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="text-zinc-400 text-center">No partners yet</div>
          ) : (
            rows.map(r => (
              <div key={r.pairId} className="flex items-center justify-between rounded-md bg-zinc-800 px-3 py-2">
                <div className="text-white text-sm">{r.partnerName}</div>
                <button
                  onClick={() => handleSelect(r.pairId)}
                  className="px-3 py-1 rounded-md bg-blue-600 text-white text-sm"
                >
                  Go
                </button>
              </div>
            ))
          )}
        </div>
        <button onClick={handleLogout} className="w-full px-3 py-2 rounded-lg bg-zinc-900 text-white text-sm">
          Log out
        </button>
      </div>
    </main>
  );
}
