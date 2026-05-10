import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom, map, type Observable } from 'rxjs';
import type { ApiEnvelope, ApiUser } from '../models/api.types';
import { unwrapEnvelope } from '../models/api.types';
import { TokenStorageService } from './token-storage.service';
import { ToastService } from './toast.service';
import { SessionStateService } from './session-state.service';
import { SKIP_ERROR_TOAST, SKIP_SUCCESS_TOAST } from '../tokens';

/** Frequent `/auth/me` calls: no success/error toasts (loader still runs). */
const meCtx = (): HttpContext =>
  new HttpContext().set(SKIP_SUCCESS_TOAST, true).set(SKIP_ERROR_TOAST, true);

const verifyInflight = new Map<string, Promise<{ access_token: string; refresh_token: string }>>();

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(TokenStorageService);
  private readonly toast = inject(ToastService);
  private readonly session = inject(SessionStateService);
  private readonly router = inject(Router);

  readonly user = this.session.user;
  readonly booted = this.session.booted;
  readonly isAuthenticated = this.session.isAuthenticated;

  async initialize(): Promise<void> {
    try {
      const at = this.tokens.getAccess();
      const rt = this.tokens.getRefresh();
      if (at) {
        try {
          const me = await firstValueFrom(this.me());
          this.session.setUser(me);
        } catch {
          if (rt) {
            const ok = await this.refreshSession();
            if (ok) {
              const me = await firstValueFrom(this.me());
              this.session.setUser(me);
            } else {
              this.tokens.clearAll();
              this.session.clear();
            }
          } else {
            this.tokens.clearAll();
            this.session.clear();
          }
        }
      } else if (rt) {
        const ok = await this.refreshSession();
        if (ok) {
          const me = await firstValueFrom(this.me());
          this.session.setUser(me);
        } else {
          this.tokens.clearAll();
          this.session.clear();
        }
      }
    } finally {
      this.session.setBooted(true);
    }
  }

  me(): Observable<ApiUser> {
    return this.http
      .get<ApiEnvelope<ApiUser>>('/auth/me', { context: meCtx() })
      .pipe(map((b) => unwrapEnvelope(b)));
  }

  async refreshUser(): Promise<void> {
    const at = this.tokens.getAccess();
    if (!at) return;
    try {
      const me = await firstValueFrom(this.me());
      this.session.setUser(me);
    } catch {
      const ok = await this.refreshSession();
      if (ok) {
        const me = await firstValueFrom(this.me());
        this.session.setUser(me);
      } else {
        this.tokens.clearAll();
        this.session.clear();
      }
    }
  }

  async login(email: string, password: string, rememberMe?: boolean): Promise<void> {
    const data = await firstValueFrom(
      this.http
        .post<
          ApiEnvelope<{ access_token: string; refresh_token: string; user: ApiUser }>
        >('/auth/login', { email, password, remember_me: rememberMe })
        .pipe(map((b) => unwrapEnvelope(b)))
    );
    this.tokens.setAccess(data.access_token);
    this.tokens.setRefresh(data.refresh_token);
    this.session.setUser(data.user);
  }

  async register(body: {
    full_name: string;
    email: string;
    password: string;
    confirm_password: string;
  }): Promise<{ message: string }> {
    return firstValueFrom(
      this.http
        .post<ApiEnvelope<{ message: string }>>('/auth/register', body)
        .pipe(map((b) => unwrapEnvelope(b)))
    );
  }

  async verifyEmail(token: string): Promise<{ access_token: string; refresh_token: string }> {
    let p = verifyInflight.get(token);
    if (!p) {
      p = firstValueFrom(
        this.http
          .post<ApiEnvelope<{ access_token: string; refresh_token: string }>>('/auth/verify-email', {
            token,
          })
          .pipe(map((b) => unwrapEnvelope(b)))
      ).finally(() => verifyInflight.delete(token));
      verifyInflight.set(token, p);
    }
    return p;
  }

  async setSessionFromTokens(access: string, refresh: string, u?: ApiUser): Promise<void> {
    this.tokens.setAccess(access);
    this.tokens.setRefresh(refresh);
    const me = u ?? (await firstValueFrom(this.me()));
    this.session.setUser(me);
  }

  async refreshSession(): Promise<boolean> {
    const rt = this.tokens.getRefresh();
    if (!rt) return false;
    try {
      const env = await firstValueFrom(
        this.http.post<ApiEnvelope<{ access_token: string; refresh_token: string }>>('/auth/refresh', {
          refresh_token: rt,
        })
      );
      const data = unwrapEnvelope(env);
      this.tokens.setAccess(data.access_token);
      this.tokens.setRefresh(data.refresh_token);
      return true;
    } catch {
      return false;
    }
  }

  async logout(options?: { skipRedirect?: boolean }): Promise<void> {
    let at = this.tokens.getAccess();
    if (!at) {
      const ok = await this.refreshSession();
      if (ok) at = this.tokens.getAccess();
    }
    if (at) {
      try {
        await firstValueFrom(
          this.http.post<ApiEnvelope<unknown>>('/auth/logout', undefined, {
            context: new HttpContext().set(SKIP_SUCCESS_TOAST, true),
          })
        );
      } catch {
        /* still clear client */
      }
    }
    this.tokens.clearAll();
    this.session.clear();
    if (!options?.skipRedirect) {
      this.toast.success('You have been signed out.');
      void this.router.navigateByUrl('/auth/login');
    }
  }
}
