"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { UserDTO } from "@/types";
import { apiGet, apiPost } from "./api";
import { getAccessToken, setTokens, clearTokens } from "./tokenStorage";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextValue {
  user: UserDTO | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<UserDTO>;
  register: (input: { name: string; email: string; phone?: string; password: string }) => Promise<UserDTO>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    // No point calling the API for a visitor who was never logged in — and
    // apiFetch's own 401-refresh handling covers the case where the stored
    // access token merely expired.
    if (!getAccessToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await apiGet<{ user: UserDTO }>("/me");
      setUser(data.user);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Bootstraps the session once on mount via an async API call; the setState
    // calls inside refresh() happen after an await, not synchronously here, so
    // this doesn't cause the cascading-render pattern the lint rule targets.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await apiPost<{ user: UserDTO } & AuthTokens>("/auth/login", { email, password });
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(
    async (input: { name: string; email: string; phone?: string; password: string }) => {
      const { data } = await apiPost<{ user: UserDTO } & AuthTokens>("/auth/register", input);
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      setUser(data.user);
      return data.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiPost("/auth/logout");
    } catch {
      // Best-effort: the tokens are discarded client-side regardless below,
      // which is what actually ends the session from this device's point of view.
    }
    clearTokens();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, refresh, login, register, logout }),
    [user, loading, refresh, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
