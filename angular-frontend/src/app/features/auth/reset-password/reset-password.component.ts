import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import type { ApiEnvelope } from '../../../core/models/api.types';
import { unwrapEnvelope } from '../../../core/models/api.types';
import { isStrongPassword, passwordValidationErrors } from '../../../shared/password-strength';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth">
      <h1 class="auth__title">Reset password</h1>
      @if (!token) {
        <p class="auth__sub">Missing reset token. Open the link from your email.</p>
      } @else {
        <form (ngSubmit)="submit()" class="form">
          <label class="field">
            <span>New password</span>
            <input type="password" [(ngModel)]="password" name="pw" autocomplete="new-password" required />
          </label>
          @if (password.length > 0 && pwErrors().length) {
            <ul class="hints">
              @for (e of pwErrors(); track e) {
                <li>{{ e }}</li>
              }
            </ul>
          }
          <label class="field">
            <span>Confirm</span>
            <input type="password" [(ngModel)]="confirm" name="c" autocomplete="new-password" required />
          </label>
          @if (confirm.length > 0 && password !== confirm) {
            <p class="err">Passwords must match</p>
          }
          <button type="submit" class="btn" [disabled]="submitting() || !canSubmit()">Update password</button>
        </form>
      }
      <p class="auth__footer"><a routerLink="/login" class="link">Back to login</a></p>
    </div>
  `,
  styles: `
    .auth {
      max-width: 22rem;
      margin: 0 auto;
      padding: 2.5rem 1rem;
    }
    .auth__title {
      text-align: center;
      font-size: 1.25rem;
      font-weight: 600;
    }
    .auth__sub {
      text-align: center;
      color: #52525b;
      font-size: 0.875rem;
    }
    .form {
      margin-top: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.875rem;
      font-weight: 500;
    }
    .field input {
      border: 1px solid #d4d4d8;
      border-radius: 0.375rem;
      padding: 0.5rem 0.75rem;
    }
    .hints {
      margin: 0;
      padding-left: 1.1rem;
      font-size: 0.75rem;
      color: #b45309;
    }
    .err {
      color: #b91c1c;
      font-size: 0.75rem;
      margin: 0;
    }
    .btn {
      padding: 0.65rem;
      border: none;
      border-radius: 0.375rem;
      background: #18181b;
      color: #fff;
      font-weight: 500;
      cursor: pointer;
    }
    .btn:disabled {
      opacity: 0.6;
    }
    .auth__footer {
      text-align: center;
      margin-top: 1.5rem;
    }
  `,
})
export class ResetPasswordComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  token = '';
  password = '';
  confirm = '';
  protected readonly submitting = signal(false);

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  pwErrors(): string[] {
    return passwordValidationErrors(this.password);
  }

  canSubmit(): boolean {
    return Boolean(this.token) && isStrongPassword(this.password) && this.password === this.confirm;
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    try {
      await firstValueFrom(
        this.http
          .post<ApiEnvelope<{ message: string }>>('/auth/reset-password', {
            token: this.token,
            password: this.password,
          })
          .pipe(map((b) => unwrapEnvelope(b)))
      );
      await this.router.navigateByUrl('/login');
    } catch {
      /* toast */
    } finally {
      this.submitting.set(false);
    }
  }
}
