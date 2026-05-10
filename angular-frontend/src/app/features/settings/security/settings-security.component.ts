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
  templateUrl: './settings-security.component.html',
  styleUrl: './settings-security.component.scss',
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
    return this.curPw.length > 0 && isStrongPassword(this.newPw) && this.newPw === this.cfPw;
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
