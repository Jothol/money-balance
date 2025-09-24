'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebase/firebase';
import { db } from '@/firebase/firebase';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { acceptInvite, cancelInvite, listIncomingInvites, listOutgoingInvites, resolveUserLabel, sendInviteByEmail } from '@/lib/invites';

type UserDoc = { firstName: string; lastName: string; email: string };
type PairLegacy = { user1Id?: string; user2Id?: string };
type PartnerRow = { pairId: string; partnerUid: string; partnerName: string; partnerEmail: string };
type InviteRowIn = { id: string; fromUid: string; fromName: string; fromEmail: string };
type InviteRowOut = { id: string; toUid?: string | null; toEmail?: string | null; toLabel: string };

export default function LinkPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [rows, setRows] = useState<PartnerRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [incoming, setIncoming] = useState<InviteRowIn[]>([]);
  const [outgoing, setOutgoing] = useState<InviteRowOut[]>([]);
  const [loadingInv, setLoadingInv] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) {
        router.replace('/');
        return;
      }
      setUid(u.uid);
      setEmail(u.email ?? '');
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
          items.push({ pairId, partnerUid, partnerName: name || fallback, partnerEmail: u?.email ?? '' });
        }
        if (!cancelled) setRows(items.sort((a, b) => a.partnerName.localeCompare(b.partnerName)));
      } finally {
        if (!cancelled) setLoadingRows(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const refreshInvites = async () => {
    if (!uid) return;
    setLoadingInv(true);
    try {
      const inc = await listIncomingInvites(uid, email);
      const out = await listOutgoingInvites(uid);
      const incRows: InviteRowIn[] = [];
      for (const inv of inc) {
        const info = await resolveUserLabel(inv.fromUid);
        incRows.push({ id: inv.id as string, fromUid: inv.fromUid, fromName: info.name, fromEmail: info.email });
      }
      const outRows: InviteRowOut[] = [];
      for (const inv of out) {
        if (inv.toUid) {
          const info = await resolveUserLabel(inv.toUid);
          outRows.push({ id: inv.id as string, toUid: inv.toUid, toEmail: null, toLabel: info.name || info.email || inv.toUid.slice(0, 6) });
        } else {
          outRows.push({ id: inv.id as string, toUid: null, toEmail: inv.toEmail ?? '', toLabel: inv.toEmail ?? '' });
        }
      }
      setIncoming(incRows);
      setOutgoing(outRows);
    } finally {
      setLoadingInv(false);
    }
  };

  useEffect(() => {
    if (!uid) return;
    refreshInvites();
  }, [uid, email]);

  const handleSelect = async (pairId: string) => {
    if (!uid) return;
    if (typeof window !== 'undefined') localStorage.setItem('activePairId', pairId);
    try {
      await setDoc(doc(db, 'users', uid), { activePairId: pairId }, { merge: true });
    } catch {}
    router.replace('/totals');
  };

  const handleAccept = async (inviteId: string, partnerUid: string) => {
    if (!uid) return;
    try {
      const pid = await acceptInvite(inviteId, uid, partnerUid);
      if (pid) {
        if (typeof window !== 'undefined') localStorage.setItem('activePairId', pid);
        try {
          await setDoc(doc(db, 'users', uid), { activePairId: pid }, { merge: true });
        } catch {}
        router.replace('/totals');
      } else {
        await refreshInvites();
      }
    } catch {
      await refreshInvites();
    }
  };

  const handleCancel = async (inviteId: string) => {
    try {
      await cancelInvite(inviteId);
    } finally {
      await refreshInvites();
    }
  };

  const handleSendInvite = async () => {
    if (!uid) return;
    const target = inviteEmail.trim();
    if (!target) return;
    if (email && target.toLowerCase() === email.toLowerCase()) {
      setInviteError('Cannot invite yourself');
      setInviteSuccess(null);
      return;
    }
    setSendingInvite(true);
    setInviteError(null);
    setInviteSuccess(null);
    try {
      await sendInviteByEmail(uid, target);
      setInviteSuccess('Invite sent');
      setInviteEmail('');
      await refreshInvites();
    } catch {
      setInviteError('Failed to send invite');
    } finally {
      setSendingInvite(false);
    }
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
    <main className="min-h-screen flex items-center justify-center p-6 bg-zinc-950">
      <div className="w-full max-w-sm space-y-6 text-white">
        <div className="text-center text-xl font-semibold">Select Partner Tracker</div>

        <div className="rounded-lg bg-zinc-900 p-3 max-h-64 overflow-y-auto space-y-2">
          {loadingRows ? (
            <div className="text-zinc-400 text-center">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="text-zinc-400 text-center">No partners yet</div>
          ) : (
            rows.map(r => (
              <div key={r.pairId} className="flex items-center justify-between rounded-md bg-zinc-800 px-3 py-2">
                <div className="text-sm">{r.partnerName}</div>
                <button onClick={() => handleSelect(r.pairId)} className="px-3 py-1 rounded-md bg-blue-600 text-white text-sm">
                  Go
                </button>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3">
          <div className="font-semibold">Incoming invites</div>
          <div className="rounded-lg bg-zinc-900 p-3 max-h-56 overflow-y-auto space-y-2">
            {loadingInv ? (
              <div className="text-zinc-400 text-center">Loading...</div>
            ) : incoming.length === 0 ? (
              <div className="text-zinc-400 text-center">None</div>
            ) : (
              incoming.map(inv => (
                <div key={inv.id} className="flex items-center justify-between rounded-md bg-zinc-800 px-3 py-2">
                  <div className="text-sm">From {inv.fromName}</div>
                  <button onClick={() => handleAccept(inv.id, inv.fromUid)} className="px-3 py-1 rounded-md bg-green-600 text-white text-sm">
                    Accept
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="font-semibold">Outgoing invites</div>
          <div className="rounded-lg bg-zinc-900 p-3 max-h-56 overflow-y-auto space-y-2">
            {loadingInv ? (
              <div className="text-zinc-400 text-center">Loading...</div>
            ) : outgoing.length === 0 ? (
              <div className="text-zinc-400 text-center">None</div>
            ) : (
              outgoing.map(inv => (
                <div key={inv.id} className="flex items-center justify-between rounded-md bg-zinc-800 px-3 py-2">
                  <div className="text-sm">To {inv.toLabel}</div>
                  <button onClick={() => handleCancel(inv.id)} className="px-3 py-1 rounded-md bg-zinc-700 text-white text-sm">
                    Cancel
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="font-semibold">Send invite by email</div>
          <div className="flex gap-2">
            <input
              className="flex-1 p-2 rounded-md bg-zinc-900 text-white placeholder-zinc-500"
              placeholder="name@example.com"
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
            />
            <button
              onClick={handleSendInvite}
              disabled={sendingInvite || inviteEmail.trim().length === 0}
              className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm"
            >
              {sendingInvite ? 'Sending...' : 'Send'}
            </button>
          </div>
          {inviteError && <div className="text-red-400 text-sm">{inviteError}</div>}
          {inviteSuccess && <div className="text-green-400 text-sm">{inviteSuccess}</div>}
        </div>

        <button onClick={handleLogout} className="w-full px-3 py-2 rounded-lg bg-zinc-900 text-white text-sm">
          Log out
        </button>
      </div>
    </main>
  );
}
