"use client";

import { UserRole } from "@/types";
import { RequireAuth } from "@/components/RequireAuth";
import { AdminNav } from "@/components/admin/AdminNav";
import { OrdersTable, type AdminOrderRow } from "@/components/admin/OrdersTable";

const PAYMENT_STATUSES = new Set(["PAID", "FAILED", "REFUNDED"]);

export default function AdminPaymentsPage() {
  return (
    <RequireAuth roles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <div>
        <AdminNav />
        <div className="container-page py-8">
          <h1 className="font-display text-2xl font-bold text-ink">Paiements</h1>
          <p className="mt-1 text-sm text-ink/60">Vue des commandes ayant un statut de paiement final.</p>
          <div className="mt-6">
            <OrdersTable filter={(row: AdminOrderRow) => PAYMENT_STATUSES.has(row.status)} />
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
