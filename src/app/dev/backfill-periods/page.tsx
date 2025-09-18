'use client';

import { useEffect, useState } from 'react';
import { db } from '@/firebase/firebase';
import { usePair } from '@/hooks/usePair';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type UpdateData,
} from 'firebase/firestore';
import { toDayId, toWeekId, toMonthId } from '@/lib/period';

type RawExpense = {
  user?: string;
  from?: string;
  to?: string;
  amount?: number;
  description?: string;
  date?: string;          // 'YYYY-MM-DD'
  day?: string;           // 'YYYY-MM-DD'
  week?: string;          // 'YYYY-Www'
  month?: string;         // 'YYYY-MM'
  shared?: boolean;
  isPrivate?: boolean;
  type?: 'purchase' | 'payment' | 'gift';
  createdAt?: Timestamp;
  archived?: boolean;
  pairId?: string;
};

type Candidate = {
  id: string;
  update: Record<string, unknown>;
  preview: {
    before: Partial<RawExpense>;
    after: Partial<RawExpense>;
  };
};

function parseLocalYYYYMMDD(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1); // local midnight
}

function normalizeEmail(s?: string) {
  return (s ?? '').toLowerCase();
}

function deriveDates(raw: RawExpense): { day: string; week: string; month: string } {
  let base: Date;
  if (raw.date && /^\d{4}-\d{2}-\d{2}$/.test(raw.date)) {
    base = parseLocalYYYYMMDD(raw.date);   // local, not UTC "Z"
  } else if (raw.createdAt instanceof Timestamp) {
    base = raw.createdAt.toDate();
  } else {
    base = new Date();
  }
  return { day: toDayId(base), week: toWeekId(base), month: toMonthId(base) };
}

export default function BackfillPeriodsPage() {
  const { pairId, loading } = usePair();
  const [scanning, setScanning] = useState(false);
  const [applying, setApplying] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setCandidates([]);
    setMsg('');
  }, [pairId]);

  async function scan() {
    if (!pairId) {
      setMsg('No pair selected.');
      return;
    }
    setScanning(true);
    setMsg('');

    try {
      const qy = query(collection(db, 'expenses'), where('pairId', '==', pairId));
      const snap = await getDocs(qy);
      const next: Candidate[] = [];

      snap.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
        const raw = d.data() as RawExpense;

        const before: Partial<RawExpense> = {};
        const after: Partial<RawExpense> = {};
        const update: Record<string, unknown> = {};

        // 1) normalize emails
        const u = normalizeEmail(raw.user);
        const f = normalizeEmail(raw.from);
        const t = normalizeEmail(raw.to);

        if (raw.user !== undefined && raw.user !== u) {
          before.user = raw.user;
          after.user = u;
          update.user = u;
        }
        if (raw.from !== undefined && raw.from !== f) {
          before.from = raw.from;
          after.from = f;
          update.from = f;
        }
        if (raw.to !== undefined && raw.to !== t) {
          before.to = raw.to;
          after.to = t;
          update.to = t;
        }

        // 2) derive period ids
        const dd = deriveDates(raw);

        const needDay =
          !raw.day || !/^\d{4}-\d{2}-\d{2}$/.test(raw.day) || raw.day !== dd.day;
        const needWeek =
          !raw.week || !/^\d{4}-W\d{2}$/.test(raw.week ?? '') || raw.week !== dd.week;
        const needMonth =
          !raw.month || !/^\d{4}-\d{2}$/.test(raw.month) || raw.month !== dd.month;

        if (needDay) {
          before.day = raw.day;
          after.day = dd.day;
          update.day = dd.day;
        }
        if (needWeek) {
          before.week = raw.week;
          after.week = dd.week;
          update.week = dd.week;
        }
        if (needMonth) {
          before.month = raw.month;
          after.month = dd.month;
          update.month = dd.month;
        }

        // Keep `date` aligned to the normalized day
        if (!raw.date || raw.date !== dd.day) {
          before.date = raw.date;
          after.date = dd.day;
          update.date = dd.day;
        }

        // 3) ensure archived flag exists
        if (raw.archived === undefined) {
          before.archived = raw.archived;
          after.archived = false;
          update.archived = false;
        }

        // 4) ensure pairId exists (safety)
        if (!raw.pairId) {
          before.pairId = raw.pairId;
          after.pairId = pairId;
          update.pairId = pairId;
        }

        if (Object.keys(update).length > 0) {
          next.push({ id: d.id, update, preview: { before, after } });
        }
      });

      setCandidates(next);
      setMsg(`Found ${next.length} docs needing updates.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setScanning(false);
    }
  }

  async function apply() {
    if (!pairId) {
      setMsg('No pair selected.');
      return;
    }
    if (candidates.length === 0) {
      setMsg('Nothing to update.');
      return;
    }
    setApplying(true);
    setMsg('');

    try {
      const CHUNK = 400;
      for (let i = 0; i < candidates.length; i += CHUNK) {
        const batch = writeBatch(db);
        const slice = candidates.slice(i, i + CHUNK);
        slice.forEach((c) => {
          batch.update(
            doc(db, 'expenses', c.id),
            c.update as UpdateData<DocumentData>
          );
        });
        await batch.commit();
      }
      setMsg(`Applied updates to ${candidates.length} docs.`);
      setCandidates([]);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-lg font-semibold">Backfill: day/week/month + archived</h1>
      <div className="text-sm text-gray-600">Pair: {loading ? 'Loading…' : pairId ?? '(none)'}</div>

      <div className="flex gap-2">
        <button
          onClick={scan}
          disabled={scanning || !pairId}
          className="rounded bg-blue-600/80 px-4 py-2 text-white disabled:opacity-50"
        >
          {scanning ? 'Scanning…' : 'Scan & Preview'}
        </button>
        <button
          onClick={apply}
          disabled={applying || candidates.length === 0}
          className="rounded bg-green-600/80 px-4 py-2 text-white disabled:opacity-50"
        >
          {applying ? 'Applying…' : `Apply (${candidates.length})`}
        </button>
      </div>

      {msg && <p className="text-sm">{msg}</p>}

      {candidates.length > 0 && (
        <div className="border rounded p-3">
          <div className="font-medium mb-2">Preview (first 10)</div>
          <ul className="text-xs space-y-2">
            {candidates.slice(0, 10).map((c) => (
              <li key={c.id} className="border rounded p-2">
                <div>ID: {c.id}</div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <pre className="bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(c.preview.before, null, 2)}
                  </pre>
                  <pre className="bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(c.preview.after, null, 2)}
                  </pre>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
