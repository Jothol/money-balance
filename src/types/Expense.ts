export interface Expense {
  id: string;
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
