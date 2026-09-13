// Auth tokens live in localStorage rather than cookies, since the frontend
// and backend are deployed to different origins (Vercel + Render) and a
// Bearer token sidesteps cross-site cookie restrictions entirely. Trade-off:
// unlike an httpOnly cookie, a token in localStorage is readable by any JS
// running on the page, so it's vulnerable if the app is ever compromised by
// an XSS bug — keep that in mind before rendering any unsanitized HTML.

const ACCESS_TOKEN_KEY = "noma_access_token";
const REFRESH_TOKEN_KEY = "noma_refresh_token";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setTokens(tokens: { accessToken: string; refreshToken: string }): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } catch {
    // localStorage unavailable (private browsing, quota, disabled) — auth
    // just won't persist across reloads; nothing else to do about it here.
  }
}

export function clearTokens(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // ignore
  }
}
