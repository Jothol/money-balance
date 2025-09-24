'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { db } from '@/firebase/firebase';
import { Timestamp, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { Expense } from '@/types/Expense';

type WithTS = Expense & { createdAt?: Timestamp };
type State = { pairId: string | null; items: WithTS[]; loaded: boolean; loading: boolean };
type UpdateInput = { id: string; description?: string; amount?: number };
type API = {
  state: State;
  loadForPair: (pairId: string, opts?: { force?: boolean }) => Promise<void>;
  refresh: () => Promise<void>;
  upsertLocal: (e: WithTS) => void;
  updateExpense: (input: UpdateInput) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  reset: () => void;
};

const Ctx = createContext<API | null>(null);

function cmpDesc(a: WithTS, b: WithTS) {
  const da = a.date ?? '';
  const dbs = b.date ?? '';
  if (da < dbs) return 1;
  if (da > dbs) return -1;
  const ma = a.createdAt ? a.createdAt.toMillis() : 0;
  const mb = b.createdAt ? b.createdAt.toMillis() : 0;
  return mb - ma;
}

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({ pairId: null, items: [], loaded: false, loading: false });

  const loadForPair = useCallback(async (pairId: string, opts?: { force?: boolean }) => {
    if (!pairId) return;
    if (!opts?.force && state.loaded && state.pairId === pairId) return;
    setState(s => ({ ...s, loading: true }));
    const col = collection(db, 'expenses');
    const q = query(col, where('pairId', '==', pairId));
    const snap = await getDocs(q);
    const rows = snap.docs.map(d => {
      const data = d.data() as WithTS;
      return { ...data, id: data.id ?? d.id };
    });
    setState({ pairId, items: rows.sort(cmpDesc), loaded: true, loading: false });
  }, [state.loaded, state.pairId]);

  const refresh = useCallback(async () => {
    if (!state.pairId) return;
    await loadForPair(state.pairId, { force: true });
  }, [state.pairId, loadForPair]);

  const upsertLocal = useCallback((e: WithTS) => {
    setState(s => {
      const idx = s.items.findIndex(x => x.id === e.id);
      const next = idx >= 0 ? [...s.items.slice(0, idx), e, ...s.items.slice(idx + 1)] : [e, ...s.items];
      return { ...s, items: next.sort(cmpDesc) };
    });
  }, []);

  const updateExpense = useCallback(async (input: UpdateInput) => {
    const ref = doc(db, 'expenses', input.id);
    const patch: Partial<WithTS> = {};
    if (typeof input.description !== 'undefined') patch.description = input.description;
    if (typeof input.amount !== 'undefined') patch.amount = input.amount;
    await updateDoc(ref, patch);
    setState(s => {
      const idx = s.items.findIndex(x => x.id === input.id);
      if (idx < 0) return s;
      const merged = { ...s.items[idx], ...patch };
      const next = [...s.items.slice(0, idx), merged, ...s.items.slice(idx + 1)];
      return { ...s, items: next.sort(cmpDesc) };
    });
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    const ref = doc(db, 'expenses', id);
    await deleteDoc(ref);
    setState(s => ({ ...s, items: s.items.filter(x => x.id !== id) }));
  }, []);

  const reset = useCallback(() => setState({ pairId: null, items: [], loaded: false, loading: false }), []);

  useEffect(() => {
    const w = window as unknown as { expenseStoreRefresh?: () => void };
    w.expenseStoreRefresh = refresh;
    return () => {
      const ww = window as unknown as { expenseStoreRefresh?: () => void };
      if (ww.expenseStoreRefresh === refresh) ww.expenseStoreRefresh = undefined;
    };
  }, [refresh]);

  const value = useMemo<API>(() => ({ state, loadForPair, refresh, upsertLocal, updateExpense, deleteExpense, reset }), [state, loadForPair, refresh, upsertLocal, updateExpense, deleteExpense, reset]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useExpenses() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useExpenses must be used within ExpensesProvider');
  return ctx;
}
