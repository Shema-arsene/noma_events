"use client";

import { UserRole } from "@/types";
import { RequireAuth } from "@/components/RequireAuth";
import { AdminNav } from "@/components/admin/AdminNav";
import { OrdersTable } from "@/components/admin/OrdersTable";

export default function AdminOrdersPage() {
  return (
    <RequireAuth roles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      <div>
        <AdminNav />
        <div className="container-page py-8">
          <h1 className="font-display text-2xl font-bold text-ink">Commandes</h1>
          <div className="mt-6">
            <OrdersTable />
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
