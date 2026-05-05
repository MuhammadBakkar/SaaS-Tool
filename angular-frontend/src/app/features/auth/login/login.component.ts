import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { API_BASE_URL } from '../../../core/tokens';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth">
      <h1 class="auth__title">Sign in</h1>
      <p class="auth__sub">AI Ads Generator</p>
      <div class="auth__body">
        <a class="google" [href]="googleHref()">Continue with Google</a>
        <div class="auth__divider"><span>or</span></div>
        <form (ngSubmit)="submit()" class="form">
          <label class="field">
            <span>Email</span>
            <input type="email" name="email" [(ngModel)]="email" autocomplete="email" required />
          </label>
          <label class="field">
            <span>Password</span>
            <input type="password" name="password" [(ngModel)]="password" autocomplete="current-password" required />
          </label>
          <div class="row">
            <label class="remember">
              <input type="checkbox" [(ngModel)]="rememberMe" name="remember" />
              Remember me
            </label>
            <a routerLink="/forgot-password" class="link">Forgot password?</a>
          </div>
          <button type="submit" class="btn" [disabled]="submitting()">
            {{ submitting() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
      </div>
      <p class="auth__footer">
        No account?
        <a routerLink="/register" class="link">Register</a>
      </p>
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
      margin: 0.25rem 0 0;
    }
    .auth__body {
      margin-top: 2rem;
    }
    .google {
      display: flex;
      width: 100%;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1rem;
      border-radius: 0.375rem;
      border: 1px solid #d4d4d8;
      background: #fff;
      font-size: 0.875rem;
      font-weight: 500;
      color: #27272a;
      text-decoration: none;
    }
    .google:hover {
      background: #fafafa;
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
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
      gap: 0.5rem;
    }
    .remember {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      color: #3f3f46;
      cursor: pointer;
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
    }
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .link {
      color: #3f3f46;
      font-weight: 500;
    }
    .auth__footer {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.875rem;
      color: #52525b;
    }
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly apiBase = inject(API_BASE_URL);

  email = '';
  password = '';
  rememberMe = false;
  protected readonly submitting = signal(false);

  googleHref(): string {
    return `${this.apiBase.replace(/\/$/, '')}/auth/google`;
  }

  async submit(): Promise<void> {
    this.submitting.set(true);
    try {
      await this.auth.login(this.email, this.password, this.rememberMe);
      await this.router.navigateByUrl('/dashboard');
    } catch {
      /* toast from interceptor */
    } finally {
      this.submitting.set(false);
    }
  }
}
