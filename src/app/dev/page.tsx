'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase/firebase';
import { db } from '@/firebase/firebase';
import { canonicalPairId } from '@/lib/pairs';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';

const ALLOWED = new Set(['XhjLlhXl0hZXXfmQFq614hhuonH3', 'Ep3O8OlXyUcGcsP8PIIbIOD0v7E3']);

export default function DevPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [partnerEmail, setPartnerEmail] = useState<string>('');
  const [partnerUid, setPartnerUid] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u || !ALLOWED.has(u.uid)) {
        router.replace('/');
        return;
      }
      setUid(u.uid);
      setEmail(u.email ?? '');
    });
    return () => unsub();
  }, [router]);

  const computedPairId = useMemo(() => {
    if (!uid || !partnerUid) return '';
    return canonicalPairId(uid, partnerUid);
  }, [uid, partnerUid]);

  const resolvePartnerUid = async () => {
    if (!partnerEmail.trim()) {
      setPartnerUid(null);
      return;
    }
    const qUsers = query(
      collection(db, 'users'),
      where('emailLower', '==', partnerEmail.trim().toLowerCase())
    );
    const r = await getDocs(qUsers);
    if (r.empty) {
      setPartnerUid(null);
      setStatus('Partner not found');
      return;
    }
    setPartnerUid(r.docs[0].id);
    setStatus('');
  };

  const backupExpenses = async () => {
    setBusy(true);
    setStatus('Backing up...');
    try {
      const snap = await getDocs(collection(db, 'expenses'));
      const backupId = `expenses_${Date.now()}`;
      let batch = writeBatch(db);
      let count = 0;
      for (const d of snap.docs) {
        const dest = doc(db, 'backups', backupId, 'expenses', d.id);
        const data = d.data() as Record<string, unknown>;
        batch.set(dest, { ...data, _backedUpAt: serverTimestamp() });
        count += 1;
        if (count % 450 === 0) {
          await batch.commit();
          batch = writeBatch(db);
        }
      }
      await batch.commit();
      setStatus(`Backup complete: ${backupId} (${snap.size} docs)`);
    } catch {
      setStatus('Backup failed');
    } finally {
      setBusy(false);
    }
  };

  const tagAllExpensesWithPair = async () => {
    if (!uid || !partnerUid) {
      setStatus('Resolve partner first');
      return;
    }
    const pid = canonicalPairId(uid, partnerUid);
    setBusy(true);
    setStatus('Tagging expenses...');
    try {
      const snap = await getDocs(collection(db, 'expenses'));
      let batch = writeBatch(db);
      let count = 0;
      for (const d of snap.docs) {
        const ref = doc(db, 'expenses', d.id);
        batch.set(ref, { pairId: pid }, { merge: true });
        count += 1;
        if (count % 450 === 0) {
          await batch.commit();
          batch = writeBatch(db);
        }
      }
      await batch.commit();
      setStatus(`Tagged ${snap.size} expenses with pairId ${pid}`);
    } catch {
      setStatus('Tagging failed');
    } finally {
      setBusy(false);
    }
  };

  if (!uid) return null;

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-xl font-semibold text-center">Dev: Expenses Backup & Tag</div>

        <div className="space-y-2">
          <div className="text-sm text-zinc-400">Signed in as {email || uid}</div>
          <div className="text-sm">Partner email</div>
          <div className="flex gap-2">
            <input
              className="flex-1 p-2 rounded-md bg-zinc-900 text-white placeholder-zinc-500"
              placeholder="partner@example.com"
              type="email"
              value={partnerEmail}
              onChange={e => setPartnerEmail(e.target.value)}
              onBlur={resolvePartnerUid}
            />
            <button
              onClick={resolvePartnerUid}
              disabled={busy || partnerEmail.trim().length === 0}
              className="px-3 py-2 rounded-md bg-zinc-700 text-white text-sm"
            >
              Resolve
            </button>
          </div>
          <div className="text-sm text-zinc-400">
            Partner UID: {partnerUid || '—'}
          </div>
          <div className="text-sm text-zinc-400">
            Pair ID: {computedPairId || '—'}
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={backupExpenses}
            disabled={busy}
            className="w-full px-3 py-2 rounded-md bg-blue-600 text-white"
          >
            {busy ? 'Working...' : 'Back up expenses'}
          </button>
          <button
            onClick={tagAllExpensesWithPair}
            disabled={busy || !partnerUid}
            className="w-full px-3 py-2 rounded-md bg-green-600 text-white"
          >
            {busy ? 'Working...' : 'Tag all expenses with pairId'}
          </button>
        </div>

        <div className="text-center text-sm text-zinc-300 min-h-5">{status}</div>
      </div>
    </main>
  );
}
