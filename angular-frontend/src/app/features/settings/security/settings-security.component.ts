import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/services/users.service';
import type { SessionRow, UserProfile } from '../../../core/models/api.types';
import { isStrongPassword, passwordValidationErrors } from '../../../shared/password-strength';

@Component({
  selector: 'app-settings-security',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <header class="page__head">
        <h1>Security</h1>
        <p>Password and active sessions.</p>
      </header>
      @if (loading()) {
        <p class="muted">Loading…</p>
      } @else {
        @if (profile(); as p) {
          <section>
            <h2>Change password</h2>
            @if (p.auth_provider === 'google') {
              <p class="note">Your account uses Google Sign-In. Manage your password through Google.</p>
            } @else {
              <form (ngSubmit)="changePw()" class="form">
                <label class="field">
                  <span>Current password</span>
                  <input type="password" [(ngModel)]="curPw" name="c" autocomplete="current-password" required />
                </label>
                <label class="field">
                  <span>New password</span>
                  <input type="password" [(ngModel)]="newPw" name="n" autocomplete="new-password" required />
                </label>
                @if (newPw.length > 0 && pwErrors().length) {
                  <ul class="hints">
                    @for (e of pwErrors(); track e) {
                      <li>{{ e }}</li>
                    }
                  </ul>
                }
                <label class="field">
                  <span>Confirm</span>
                  <input type="password" [(ngModel)]="cfPw" name="f" autocomplete="new-password" required />
                </label>
                @if (cfPw.length > 0 && newPw !== cfPw) {
                  <p class="err">Passwords must match</p>
                }
                <button type="submit" class="btn" [disabled]="busy() || !canPw()">Update password</button>
              </form>
            }
          </section>
          <section>
            <h2>Active sessions</h2>
            @if (sessionsLoading()) {
              <p class="muted">Loading sessions…</p>
            } @else {
              @if (otherSessions().length > 0) {
                <button type="button" class="linkish" [disabled]="bulkBusy()" (click)="revokeAllOthers()">
                  {{ bulkBusy() ? 'Signing out…' : 'Sign out all other devices' }}
                </button>
              }
              <ul class="sessions">
                @for (s of sessions(); track s.id) {
                  <li>
                    <div>
                      <strong>{{ s.device_info ?? 'Unknown device' }}</strong>
                      <div class="meta">IP: {{ s.ip_address ?? '—' }}</div>
                      @if (s.id === currentId()) {
                        <span class="pill">This device</span>
                      }
                    </div>
                    @if (s.id !== currentId()) {
                      <button type="button" class="revoke" (click)="revokeOne(s.id)">Revoke</button>
                    }
                  </li>
                }
              </ul>
            }
          </section>
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
    section {
      margin-top: 2.5rem;
    }
    h2 {
      font-size: 0.875rem;
      font-weight: 600;
      margin: 0 0 1rem;
    }
    .note {
      font-size: 0.875rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      background: #fafafa;
      border: 1px solid #e4e4e7;
      color: #3f3f46;
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
    .muted {
      color: #71717a;
      font-size: 0.875rem;
    }
    .linkish {
      border: none;
      background: none;
      color: #b91c1c;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
      margin-bottom: 0.75rem;
    }
    .sessions {
      list-style: none;
      margin: 0;
      padding: 0;
      border: 1px solid #e4e4e7;
      border-radius: 0.5rem;
      background: #fff;
    }
    .sessions li {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e4e4e7;
      font-size: 0.875rem;
    }
    .sessions li:last-child {
      border-bottom: none;
    }
    .meta {
      font-size: 0.75rem;
      color: #71717a;
      margin-top: 0.15rem;
    }
    .pill {
      display: inline-block;
      margin-top: 0.35rem;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      background: #d1fae5;
      color: #065f46;
    }
    .revoke {
      border: none;
      background: none;
      color: #b91c1c;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
    }
  `,
})
export class SettingsSecurityComponent implements OnInit {
  private readonly users = inject(UsersService);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly sessionsLoading = signal(true);
  protected readonly busy = signal(false);
  protected readonly bulkBusy = signal(false);
  protected readonly profile = signal<UserProfile | null>(null);
  protected readonly sessions = signal<SessionRow[]>([]);

  curPw = '';
  newPw = '';
  cfPw = '';

  ngOnInit(): void {
    void this.load();
  }

  currentId(): string | undefined {
    return this.auth.user()?.current_session_id ?? undefined;
  }

  otherSessions(): SessionRow[] {
    const id = this.currentId();
    return this.sessions().filter((s) => s.id !== id);
  }

  pwErrors(): string[] {
    return passwordValidationErrors(this.newPw);
  }

  canPw(): boolean {
    return (
      this.curPw.length > 0 && isStrongPassword(this.newPw) && this.newPw === this.cfPw
    );
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const p = await firstValueFrom(this.users.getProfile());
      this.profile.set(p);
    } finally {
      this.loading.set(false);
    }
    await this.loadSessions();
  }

  private async loadSessions(): Promise<void> {
    this.sessionsLoading.set(true);
    try {
      const list = await firstValueFrom(this.users.getSessions());
      this.sessions.set(list);
    } finally {
      this.sessionsLoading.set(false);
    }
  }

  async changePw(): Promise<void> {
    if (!this.canPw()) return;
    this.busy.set(true);
    try {
      await firstValueFrom(
        this.users.changePassword({
          current_password: this.curPw,
          new_password: this.newPw,
          confirm_password: this.cfPw,
        })
      );
      this.curPw = '';
      this.newPw = '';
      this.cfPw = '';
    } finally {
      this.busy.set(false);
    }
  }

  async revokeOne(id: string): Promise<void> {
    if (!window.confirm('Revoke this session?')) return;
    this.busy.set(true);
    try {
      await firstValueFrom(this.users.revokeSession(id));
      await this.loadSessions();
    } finally {
      this.busy.set(false);
    }
  }

  async revokeAllOthers(): Promise<void> {
    this.bulkBusy.set(true);
    try {
      await firstValueFrom(this.users.revokeAllOtherSessions());
      await this.loadSessions();
    } finally {
      this.bulkBusy.set(false);
    }
  }
}
