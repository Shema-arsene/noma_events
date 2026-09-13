"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { UserRole } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { LoadingState } from "@/components/ui/States";

export function RequireAuth({ children, roles }: { children: ReactNode; roles?: UserRole[] }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (roles && !roles.includes(user.role)) {
      router.replace("/");
    }
  }, [loading, user, roles, router, pathname]);

  if (loading || !user || (roles && !roles.includes(user.role))) {
    return <LoadingState />;
  }

  return <>{children}</>;
}
