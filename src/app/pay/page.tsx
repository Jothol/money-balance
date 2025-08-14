'use client';

import PurchaseForm from '@/components/pay/PurchaseForm';
import PaymentForm from '@/components/pay/PaymentForm';

export default function PayPage() {
  return (
    <div className="w-full h-full px-4 py-6">
      <h2 className="mb-2 text-2xl font-bold">Expense Editor</h2>

      <div className="mx-auto max-w-md space-y-6">
        <section className="rounded-xl bg-white p-4 shadow">
          <PurchaseForm />
        </section>

        <section className="rounded-xl bg-white p-4 shadow">
          <PaymentForm />
        </section>
      </div>
    </div>
  );
}
