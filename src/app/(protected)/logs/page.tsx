'use client';

import { useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import TabSwitch from '@/components/TabSwitch';
import SlideTabs from '@/components/SlideTabs';
import SharedPanel from '@/components/logs/SharedPanel';
import PersonalPanel from '@/components/logs/PersonalPanel';
import PrivatePanel from '@/components/logs/PrivatePanel';
import { useExpenses } from '@/hooks/useExpensesStore';
import { Expense } from '@/types/Expense';

const tabOptions = ['Shared', 'Personal', 'Private'] as const;
type TabKey = (typeof tabOptions)[number];

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export default function LogsPage() {
  const [selectedTab, setSelectedTab] = useState<TabKey>('Shared');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');
  const [desc, setDesc] = useState('');
  const [amt, setAmt] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { state, updateExpense, deleteExpense, refresh } = useExpenses();
  const index = tabOptions.indexOf(selectedTab);

  const scopedItems: Expense[] = useMemo(() => {
    if (selectedTab === 'Shared') return state.items.filter(e => e.type === 'purchase' && e.shared === true);
    if (selectedTab === 'Personal') return state.items.filter(e => e.type === 'purchase' && e.shared === false && e.isPrivate === false);
    return state.items.filter(e => e.type === 'purchase' && e.isPrivate === true);
  }, [state.items, selectedTab]);

  const selected = useMemo(() => scopedItems.find(e => e.id === selectedId), [scopedItems, selectedId]);

  function toggleEdit() {
    const next = !isEditing;
    setIsEditing(next);
    if (!next) {
      setSelectedId('');
      setDesc('');
      setAmt('');
    }
  }

  function onPick(id: string) {
    setSelectedId(id);
    const e = scopedItems.find(x => x.id === id);
    if (e) {
      setDesc(e.description || '');
      setAmt(String(e.amount));
    }
  }

  async function onSave() {
    if (!selected) return;
    await updateExpense({ id: selected.id, description: desc, amount: Number(amt) });
    refresh?.();
  }

  async function onConfirmDelete() {
    if (!selected) return;
    setConfirmDelete(false);
    await deleteExpense(selected.id);
    refresh?.();
    setSelectedId('');
    setDesc('');
    setAmt('');
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full h-full px-4 pb-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <TabSwitch
            options={[...tabOptions]}
            selected={selectedTab}
            onSelect={(tab) => setSelectedTab(tab as TabKey)}
            disabled={isEditing}
          />
        </div>
        <button
          onClick={toggleEdit}
          aria-label="Edit entries"
          className={`h-10 w-10 rounded-full flex items-center justify-center border transition-colors ${isEditing ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
        >
          <Pencil className="h-5 w-5" />
        </button>
      </div>

      {!isEditing && (
        <div className="mt-4 flex-1 min-h-0">
          <SlideTabs index={index}>
            <div className="h-full"><SharedPanel /></div>
            <div className="h-full"><PersonalPanel /></div>
            <div className="h-full"><PrivatePanel /></div>
          </SlideTabs>
        </div>
      )}

      {isEditing && (
        <div className="mt-4 flex-1 min-h-0 overflow-y-auto">
          <div className="rounded-xl p-4 bg-white/80">
            <div className="text-lg font-semibold mb-3">{selectedTab} — Edit Your Entry</div>

            <div className="space-y-2 mb-4">
              <div className="text-sm font-medium">Select Your Entry</div>
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                <ul>
                  {scopedItems.map((e) => (
                    <li key={e.id}>
                      <button
                        onClick={() => onPick(e.id)}
                        className={`w-full text-left px-4 py-3 ${selectedId === e.id ? 'bg-gray-200' : ''}`}
                      >
                        {(selectedTab === 'Shared' ? '(Shared) ' : selectedTab === 'Personal' ? '(Personal) ' : '(Private) ')}
                        {e.description || 'Untitled'} — {formatMoney(e.amount)}
                      </button>
                    </li>
                  ))}
                  {scopedItems.length === 0 && (
                    <li className="px-4 py-3 text-gray-500">No entries</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <div className="text-sm font-medium">Description</div>
              <input
                className="w-full border border-gray-300 px-3 py-2 rounded"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                disabled={!selected}
              />
            </div>

            <div className="space-y-2 mb-4">
              <div className="text-sm font-medium">Amount</div>
              <input
                type="number"
                className="w-full border border-gray-300 px-3 py-2 rounded"
                value={amt}
                onChange={(e) => setAmt(e.target.value)}
                disabled={!selected}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex-1 bg-red-600 text-white rounded-lg h-11 disabled:opacity-50"
                disabled={!selected}
              >
                Delete
              </button>
              <button
                onClick={onSave}
                className="flex-1 bg-blue-600 text-white rounded-lg h-11 disabled:opacity-50"
                disabled={!selected || desc.trim() === '' || amt.trim() === ''}
              >
                Save
              </button>
            </div>
          </div>

          {confirmDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-xl p-5 w-80">
                <div className="text-base font-semibold mb-2">Delete this entry?</div>
                <div className="text-sm text-gray-600 mb-4">This action can’t be undone.</div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 h-10 rounded-lg border border-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirmDelete}
                    className="flex-1 h-10 rounded-lg bg-red-600 text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
