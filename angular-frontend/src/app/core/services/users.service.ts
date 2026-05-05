import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import type { ApiEnvelope, SessionRow, UserPlanDetail, UserProfile } from '../models/api.types';
import { unwrapEnvelope } from '../models/api.types';
import { SKIP_ERROR_TOAST, SKIP_GLOBAL_LOADER, SKIP_SUCCESS_TOAST } from '../tokens';

const silent = (): HttpContext =>
  new HttpContext().set(SKIP_GLOBAL_LOADER, true).set(SKIP_SUCCESS_TOAST, true);

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);

  getProfile(): Observable<UserProfile> {
    return this.http
      .get<ApiEnvelope<UserProfile>>('/users/me', { context: silent() })
      .pipe(map((b) => unwrapEnvelope(b)));
  }

  updateProfile(data: { full_name?: string; timezone?: string; locale?: string }): Observable<UserProfile> {
    return this.http
      .patch<ApiEnvelope<UserProfile>>('/users/me/profile', data)
      .pipe(map((b) => unwrapEnvelope(b)));
  }

  uploadAvatar(file: File): Observable<{ avatar_url: string }> {
    const fd = new FormData();
    fd.append('avatar', file);
    return this.http
      .post<ApiEnvelope<{ avatar_url: string }>>('/users/me/avatar', fd)
      .pipe(map((b) => unwrapEnvelope(b)));
  }

  removeAvatar(): Observable<{ message: string }> {
    return this.http
      .delete<ApiEnvelope<{ message: string }>>('/users/me/avatar')
      .pipe(map((b) => unwrapEnvelope(b)));
  }

  changePassword(data: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }): Observable<{ message: string }> {
    return this.http
      .post<ApiEnvelope<{ message: string }>>('/users/me/change-password', data)
      .pipe(map((b) => unwrapEnvelope(b)));
  }

  getSessions(): Observable<SessionRow[]> {
    return this.http
      .get<ApiEnvelope<SessionRow[]>>('/users/me/sessions', { context: silent() })
      .pipe(map((b) => unwrapEnvelope(b)));
  }

  revokeSession(sessionId: string): Observable<{ message: string }> {
    return this.http
      .delete<ApiEnvelope<{ message: string }>>(`/users/me/sessions/${sessionId}`)
      .pipe(map((b) => unwrapEnvelope(b)));
  }

  revokeAllOtherSessions(): Observable<{ message: string }> {
    return this.http
      .delete<ApiEnvelope<{ message: string }>>('/users/me/sessions/all')
      .pipe(map((b) => unwrapEnvelope(b)));
  }

  requestEmailChange(data: { new_email: string; password?: string }): Observable<{ message: string }> {
    return this.http
      .post<ApiEnvelope<{ message: string }>>('/users/me/change-email', data)
      .pipe(map((b) => unwrapEnvelope(b)));
  }

  verifyEmailChange(token: string): Observable<{ message: string }> {
    const ctx = new HttpContext()
      .set(SKIP_GLOBAL_LOADER, true)
      .set(SKIP_SUCCESS_TOAST, true)
      .set(SKIP_ERROR_TOAST, true);
    return this.http
      .post<ApiEnvelope<{ message: string }>>('/users/me/verify-email-change', { token }, { context: ctx })
      .pipe(map((b) => unwrapEnvelope(b)));
  }

  getPlanSummary(): Observable<{ plan: UserPlanDetail | null; created_at: string }> {
    return this.http
      .get<ApiEnvelope<{ plan: UserPlanDetail | null; created_at: string }>>('/users/me/plan', {
        context: silent(),
      })
      .pipe(map((b) => unwrapEnvelope(b)));
  }

  deleteAccount(data: { password?: string; confirmation?: string }): Observable<{ message: string }> {
    return this.http
      .request<ApiEnvelope<{ message: string }>>('delete', '/users/me/account', { body: data })
      .pipe(map((b) => unwrapEnvelope(b)));
  }
}
