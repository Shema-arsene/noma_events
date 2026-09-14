import type { ApiError, ApiSuccess, PaginationMeta } from "@/types";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./tokenStorage";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

// This module sits outside the React tree (used from Server Components and
// plain fetch helpers alike), so it can't call useTranslations(). The locale
// is instead read off <html lang> — which app/[locale]/layout.tsx always
// sets — falling back to the app's default locale for the rare server-side
// fetch that fails before any HTML has been sent.
const FALLBACK_MESSAGES: Record<"fr" | "en", { network: string; generic: string }> = {
  fr: { network: "Impossible de contacter le serveur. Vérifiez votre connexion.", generic: "Une erreur est survenue. Veuillez réessayer." },
  en: { network: "Unable to reach the server. Check your connection.", generic: "Something went wrong. Please try again." },
};

function fallbackMessages() {
  const lang = typeof document !== "undefined" ? document.documentElement.lang : "fr";
  return FALLBACK_MESSAGES[lang === "en" ? "en" : "fr"];
}

export class ApiRequestError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface FetchOptions extends RequestInit {
  /** Attach the stored access token as a Bearer Authorization header. Default true. */
  auth?: boolean;
}

let refreshPromise: Promise<boolean> | null = null;

/**
 * Exchanges the stored refresh token for a new access/refresh pair.
 * Single-flight: concurrent 401s share one in-flight refresh instead of each
 * firing their own. Resolves to whether it succeeded.
 */
async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return false;
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
          cache: "no-store",
        });
        if (!res.ok) return false;
        const json = (await res.json().catch(() => null)) as ApiSuccess<{
          accessToken: string;
          refreshToken: string;
        }> | null;
        if (!json?.success) return false;
        setTokens({ accessToken: json.data.accessToken, refreshToken: json.data.refreshToken });
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function rawFetch(path: string, options: FetchOptions): Promise<Response> {
  const { auth = true, headers, body, ...rest } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const accessToken = auth ? getAccessToken() : null;

  try {
    return await fetch(`${API_BASE}${path}`, {
      ...rest,
      body,
      headers: {
        ...(body && !isFormData ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      cache: rest.cache ?? "no-store",
    });
  } catch {
    throw new ApiRequestError(0, "NETWORK_ERROR", fallbackMessages().network);
  }
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
  isRetry = false,
): Promise<{ data: T; meta?: PaginationMeta }> {
  const res = await rawFetch(path, options);

  // On an expired access token, transparently refresh once and retry — but
  // never for the auth endpoints themselves (a 401 there means bad
  // credentials/token, not an expiry to recover from).
  if (res.status === 401 && options.auth !== false && !isRetry && !path.startsWith("/auth/")) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch<T>(path, options, true);
    }
    clearTokens();
  }

  const json = (await res.json().catch(() => null)) as ApiSuccess<T> | ApiError | null;

  if (!res.ok || !json || json.success === false) {
    const err = json as ApiError | null;
    throw new ApiRequestError(
      res.status,
      err?.error?.code ?? "UNKNOWN_ERROR",
      err?.error?.message ?? fallbackMessages().generic,
      err?.error?.details,
    );
  }

  return { data: json.data, meta: json.meta };
}

export function apiGet<T>(path: string, options?: FetchOptions) {
  return apiFetch<T>(path, { ...options, method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown, options?: FetchOptions) {
  return apiFetch<T>(path, {
    ...options,
    method: "POST",
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function apiPatch<T>(path: string, body?: unknown, options?: FetchOptions) {
  return apiFetch<T>(path, { ...options, method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined });
}

export function apiDelete<T>(path: string, options?: FetchOptions) {
  return apiFetch<T>(path, { ...options, method: "DELETE" });
}
