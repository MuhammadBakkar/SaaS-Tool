import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import { UsersService } from '../../../core/services/users.service';
import type { UserProfile } from '../../../core/models/api.types';

@Component({
  selector: 'app-settings-email',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <header class="page__head">
        <h1>Email</h1>
        <p>Change the email you use to sign in.</p>
      </header>
      @if (loading()) {
        <p class="muted">Loading…</p>
      } @else {
        @if (profile(); as p) {
          @if (sent()) {
            <div class="card">
              <p>
                Verification email sent to <strong>{{ sentTo() }}</strong
                >. Check your inbox and click the link.
              </p>
              <button type="button" class="linkish" (click)="backToForm()">Back to form</button>
            </div>
          } @else {
            <form (ngSubmit)="submit()" class="form">
              <label class="field">
                <span>New email</span>
                <input type="email" [(ngModel)]="newEmail" name="ne" required autocomplete="email" />
              </label>
              @if (p.auth_provider === 'email') {
                <label class="field">
                  <span>Current password</span>
                  <input type="password" [(ngModel)]="password" name="pw" autocomplete="current-password" />
                </label>
              }
              <button type="submit" class="btn" [disabled]="busy()">Send verification</button>
            </form>
          }
        }
      }
    </div>
  `,
  styles: `
    .page__head h1 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }
    .page__head p {
      margin: 0.25rem 0 0;
      font-size: 0.875rem;
      color: #52525b;
    }
    .muted {
      color: #71717a;
    }
    .card {
      max-width: 28rem;
      padding: 1rem;
      border: 1px solid #e4e4e7;
      border-radius: 0.5rem;
      background: #fff;
      font-size: 0.875rem;
    }
    .form {
      max-width: 28rem;
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
      align-self: flex-start;
      padding: 0.5rem 1rem;
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
    .linkish {
      margin-top: 0.75rem;
      border: none;
      background: none;
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: underline;
      cursor: pointer;
    }
  `,
})
export class SettingsEmailComponent implements OnInit {
  private readonly users = inject(UsersService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly profile = signal<UserProfile | null>(null);
  protected readonly sent = signal(false);
  protected readonly sentTo = signal('');

  newEmail = '';
  password = '';

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const p = await firstValueFrom(this.users.getProfile());
      this.profile.set(p);
    } finally {
      this.loading.set(false);
    }
  }

  backToForm(): void {
    this.sent.set(false);
    this.newEmail = '';
    this.password = '';
  }

  async submit(): Promise<void> {
    const p = this.profile();
    if (!p) return;
    if (p.auth_provider === 'email' && !this.password.trim()) {
      this.toast.error('Enter your password to confirm this change.');
      return;
    }
    this.busy.set(true);
    try {
      await firstValueFrom(
        this.users.requestEmailChange({
          new_email: this.newEmail.trim(),
          ...(p.auth_provider === 'email' && this.password.trim()
            ? { password: this.password }
            : {}),
        })
      );
      this.sentTo.set(this.newEmail.trim());
      this.sent.set(true);
      this.password = '';
      const fresh = await firstValueFrom(this.users.getProfile());
      this.profile.set(fresh);
    } finally {
      this.busy.set(false);
    }
  }
}
