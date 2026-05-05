/**
 * Access token lives in memory (React state) only — not localStorage.
 * Refresh token is stored in an httpOnly cookie via `/api/auth/set-cookie`.
 */

let accessTokenMemory: string | null = null;

export function setAccessToken(token: string | null) {
  accessTokenMemory = token;
}

export function getAccessToken(): string | null {
  return accessTokenMemory;
}
