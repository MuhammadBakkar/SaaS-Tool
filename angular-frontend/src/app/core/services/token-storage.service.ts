import { Injectable } from '@angular/core';

const REFRESH_KEY = 'saas_tool_refresh_token';

/**
 * Access token is kept in memory. Refresh token uses sessionStorage so reloads can
 * call POST /auth/refresh (replaces Next.js httpOnly cookie + /api/auth/* routes).
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private access: string | null = null;

  getAccess(): string | null {
    return this.access;
  }

  setAccess(token: string | null): void {
    this.access = token;
  }

  getRefresh(): string | null {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage.getItem(REFRESH_KEY);
  }

  setRefresh(token: string | null): void {
    if (typeof sessionStorage === 'undefined') return;
    if (token) sessionStorage.setItem(REFRESH_KEY, token);
    else sessionStorage.removeItem(REFRESH_KEY);
  }

  clearAll(): void {
    this.access = null;
    this.setRefresh(null);
  }
}
