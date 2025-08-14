// types/Expense.ts
export interface Expense {
  id: string;
  pairId: string;                 // ← add this (can be required now that you’ve backfilled)
  user?: string;
  from?: string;
  to?: string;
  amount: number;
  description?: string;
  date: string;
  shared: boolean;
  isPrivate: boolean;
  type?: 'purchase' | 'payment' | 'gift';
}
