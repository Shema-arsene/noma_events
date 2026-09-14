"use client";

import { RequireAuth } from "@/components/RequireAuth";
import { AccountNav } from "@/components/account/AccountNav";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="container-page py-8">
        <AccountNav />
        <div className="mt-6">{children}</div>
      </div>
    </RequireAuth>
  );
}
