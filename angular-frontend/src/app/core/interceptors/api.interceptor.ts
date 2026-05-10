import {
  HttpBackend,
  HttpClient,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, map, shareReplay, switchMap, tap, throwError, type Observable } from 'rxjs';
import type { ApiEnvelope } from '../models/api.types';
import { unwrapEnvelope } from '../models/api.types';
import { LoaderService } from '../services/loader.service';
import { SessionStateService } from '../services/session-state.service';
import { ToastService } from '../services/toast.service';
import { TokenStorageService } from '../services/token-storage.service';
import {
  API_BASE_URL,
  SKIP_AUTH_RETRY,
  SKIP_ERROR_TOAST,
  SKIP_GLOBAL_LOADER,
  SKIP_SUCCESS_TOAST,
} from '../tokens';

type RefreshTokens = { access_token: string; refresh_token: string };

let refreshMutex$: Observable<RefreshTokens> | null = null;

function isAuthPublicPath(url: string): boolean {
  const paths = [
    '/auth/login',
    '/auth/register',
    '/auth/verify-email',
    '/auth/refresh',
    '/auth/forgot-password',
    '/auth/reset-password',
  ];
  return paths.some((p) => url.includes(p));
}

/** JSON envelope returned with HTTP 200 but logical failure (unwrap would throw). */
function isErrorEnvelope(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const status = (body as { status?: unknown }).status;
  return typeof status === 'number' && status >= 400;
}

function errorMessageFromHttp(err: HttpErrorResponse): string | null {
  const e = err.error;
  if (typeof e === 'string' && e.trim()) return e.trim();
  if (e && typeof e === 'object' && e !== null) {
    const msg = (e as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
    if (Array.isArray(msg) && msg.length) return msg.map(String).join('; ');
  }
  if (err.message?.trim()) return err.message;
  return null;
}

function mutexRefresh(
  rawHttp: HttpClient,
  baseUrl: string,
  refreshToken: string
): Observable<RefreshTokens> {
  if (!refreshMutex$) {
    refreshMutex$ = rawHttp
      .post<ApiEnvelope<RefreshTokens>>(`${baseUrl}/auth/refresh`, { refresh_token: refreshToken })
      .pipe(
        map((b) => unwrapEnvelope(b)),
        finalize(() => {
          refreshMutex$ = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
  }
  return refreshMutex$;
}

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(API_BASE_URL).replace(/\/$/, '');
  const tokens = inject(TokenStorageService);
  const backend = inject(HttpBackend);
  const rawHttp = new HttpClient(backend);
  const loader = inject(LoaderService);
  const toast = inject(ToastService);
  const session = inject(SessionStateService);

  const fullUrl = req.url.startsWith('http') ? req.url : `${baseUrl}${req.url.startsWith('/') ? '' : '/'}${req.url}`;

  let outbound = req.clone({ url: fullUrl });
  if (
    outbound.body &&
    !(outbound.body instanceof FormData) &&
    !outbound.headers.has('Content-Type')
  ) {
    outbound = outbound.clone({ setHeaders: { 'Content-Type': 'application/json' } });
  }
  if (outbound.body instanceof FormData && outbound.headers.has('Content-Type')) {
    outbound = outbound.clone({ headers: outbound.headers.delete('Content-Type') });
  }

  const at = tokens.getAccess();
  if (at) {
    outbound = outbound.clone({ setHeaders: { Authorization: `Bearer ${at}` } });
  }

  const skipLoader = outbound.context.get(SKIP_GLOBAL_LOADER);
  if (!skipLoader) loader.begin();

  return next(outbound).pipe(
    tap({
      next: (ev) => {
        if (!(ev instanceof HttpResponse)) return;
        const body = ev.body;
        if (isErrorEnvelope(body)) {
          if (!outbound.context.get(SKIP_ERROR_TOAST)) {
            const msg =
              body && typeof body === 'object' && 'message' in body
                ? String((body as { message: unknown }).message ?? '').trim()
                : null;
            if (msg) toast.error(msg);
          }
          return;
        }
        if (outbound.context.get(SKIP_SUCCESS_TOAST)) return;
        if (!body || typeof body !== 'object' || !('message' in body)) return;
        const msg = String((body as { message: unknown }).message ?? '').trim();
        if (!msg) return;
        const method = outbound.method.toUpperCase();
        if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
          toast.info(msg);
        } else {
          toast.success(msg);
        }
      },
    }),
    finalize(() => {
      if (!skipLoader) loader.end();
    }),
    catchError((err: HttpErrorResponse) => {
      const canRefresh =
        err.status === 401 &&
        !outbound.headers.has('X-Auth-Retry') &&
        !outbound.context.get(SKIP_AUTH_RETRY) &&
        !isAuthPublicPath(fullUrl);
      const rt = tokens.getRefresh();
      if (canRefresh && rt) {
        return mutexRefresh(rawHttp, baseUrl, rt).pipe(
          switchMap((data) => {
            tokens.setAccess(data.access_token);
            tokens.setRefresh(data.refresh_token);
            const retry = outbound.clone({
              setHeaders: {
                Authorization: `Bearer ${data.access_token}`,
                'X-Auth-Retry': '1',
              },
            });
            return next(retry);
          }),
          catchError(() => {
            tokens.clearAll();
            session.clear();
            if (!outbound.context.get(SKIP_ERROR_TOAST)) {
              const msg = errorMessageFromHttp(err);
              if (msg) toast.error(msg);
            }
            return throwError(() => err);
          })
        );
      }

      if (!outbound.context.get(SKIP_ERROR_TOAST)) {
        const msg = errorMessageFromHttp(err);
        if (msg) toast.error(msg);
      }
      return throwError(() => err);
    })
  );
};
