import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { map, firstValueFrom } from 'rxjs';
import type { ApiEnvelope } from '../../../core/models/api.types';
import { unwrapEnvelope } from '../../../core/models/api.types';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth">
      <h1 class="auth__title">Forgot password</h1>
      <p class="auth__sub">Enter your email and we&apos;ll send a reset link if the account exists.</p>
      <form (ngSubmit)="submit()" class="form">
        <label class="field">
          <span>Email</span>
          <input type="email" [(ngModel)]="email" name="email" required autocomplete="email" />
        </label>
        <button type="submit" class="btn" [disabled]="submitting()">Send link</button>
      </form>
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
      margin: 0;
    }
    .auth__sub {
      text-align: center;
      font-size: 0.875rem;
      color: #52525b;
      margin: 0.5rem 0 0;
    }
    .form {
      margin-top: 2rem;
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
    .btn {
      padding: 0.65rem;
      border-radius: 0.375rem;
      border: none;
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
    .link {
      color: #3f3f46;
    }
  `,
})
export class ForgotPasswordComponent {
  private readonly http = inject(HttpClient);

  email = '';
  protected readonly submitting = signal(false);

  async submit(): Promise<void> {
    this.submitting.set(true);
    try {
      await firstValueFrom(
        this.http
          .post<ApiEnvelope<{ message: string }>>('/auth/forgot-password', { email: this.email.trim() })
          .pipe(map((b) => unwrapEnvelope(b)))
      );
    } catch {
      /* toast */
    } finally {
      this.submitting.set(false);
    }
  }
}
