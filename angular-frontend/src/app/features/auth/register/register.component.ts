import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { API_BASE_URL } from '../../../core/tokens';
import { isStrongPassword, passwordValidationErrors } from '../../../shared/password-strength';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    @if (sent()) {
      <div class="auth">
        <h1 class="auth__title">Check your email</h1>
        <p class="auth__sub">We sent a verification link. Open it to activate your account, then sign in.</p>
        <a routerLink="/login" class="btn btn--block">Back to login</a>
      </div>
    } @else {
      <div class="auth">
        <h1 class="auth__title">Create account</h1>
        <p class="auth__sub">AI Ads Generator</p>
        <div class="auth__body">
          <a class="google" [href]="googleHref()">Continue with Google</a>
          <div class="auth__divider"><span>or</span></div>
          <form (ngSubmit)="submit()" class="form">
            <label class="field">
              <span>Full name</span>
              <input type="text" name="full_name" [(ngModel)]="fullName" autocomplete="name" required minlength="2" />
            </label>
            <label class="field">
              <span>Email</span>
              <input type="email" name="email" [(ngModel)]="email" autocomplete="email" required />
            </label>
            <label class="field">
              <span>Password</span>
              <input type="password" name="password" [(ngModel)]="password" autocomplete="new-password" required />
            </label>
            @if (password.length > 0 && pwErrors().length) {
              <ul class="hints">
                @for (e of pwErrors(); track e) {
                  <li>{{ e }}</li>
                }
              </ul>
            }
            <label class="field">
              <span>Confirm password</span>
              <input
                type="password"
                name="confirm"
                [(ngModel)]="confirmPassword"
                autocomplete="new-password"
                required
              />
            </label>
            @if (confirmPassword.length > 0 && password !== confirmPassword) {
              <p class="err">Passwords do not match</p>
            }
            <button
              type="submit"
              class="btn"
              [disabled]="submitting() || !canSubmit()"
            >
              {{ submitting() ? 'Creating…' : 'Create account' }}
            </button>
          </form>
        </div>
        <p class="auth__footer">
          Already have an account?
          <a routerLink="/login" class="link">Sign in</a>
        </p>
      </div>
    }
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
      margin: 0.25rem 0 0;
    }
    .auth__body {
      margin-top: 2rem;
    }
    .google {
      display: flex;
      width: 100%;
      justify-content: center;
      padding: 0.6rem 1rem;
      border-radius: 0.375rem;
      border: 1px solid #d4d4d8;
      background: #fff;
      font-size: 0.875rem;
      font-weight: 500;
      color: #27272a;
      text-decoration: none;
    }
    .auth__divider {
      position: relative;
      text-align: center;
      margin: 1.25rem 0;
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #71717a;
    }
    .auth__divider span {
      background: #fff;
      padding: 0 0.5rem;
      position: relative;
      z-index: 1;
    }
    .auth__divider::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 50%;
      border-top: 1px solid #e4e4e7;
    }
    .form {
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
      color: #3f3f46;
    }
    .field input {
      border: 1px solid #d4d4d8;
      border-radius: 0.375rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
    }
    .hints {
      margin: 0;
      padding-left: 1.1rem;
      font-size: 0.75rem;
      color: #b45309;
    }
    .err {
      margin: 0;
      font-size: 0.75rem;
      color: #b91c1c;
    }
    .btn {
      width: 100%;
      padding: 0.65rem 1rem;
      border-radius: 0.375rem;
      border: none;
      background: #18181b;
      color: #fff;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      text-align: center;
      text-decoration: none;
      display: inline-block;
    }
    .btn--block {
      margin-top: 2rem;
    }
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .auth__footer {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.875rem;
      color: #52525b;
    }
    .link {
      font-weight: 500;
      color: #18181b;
    }
  `,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly apiBase = inject(API_BASE_URL);

  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  protected readonly submitting = signal(false);
  protected readonly sent = signal(false);

  googleHref(): string {
    return `${this.apiBase.replace(/\/$/, '')}/auth/google`;
  }

  pwErrors(): string[] {
    return passwordValidationErrors(this.password);
  }

  canSubmit(): boolean {
    return (
      this.fullName.trim().length >= 2 &&
      this.email.includes('@') &&
      isStrongPassword(this.password) &&
      this.password === this.confirmPassword
    );
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    try {
      await this.auth.register({
        full_name: this.fullName.trim(),
        email: this.email.trim(),
        password: this.password,
        confirm_password: this.confirmPassword,
      });
      this.sent.set(true);
    } catch {
      /* toast */
    } finally {
      this.submitting.set(false);
    }
  }
}
