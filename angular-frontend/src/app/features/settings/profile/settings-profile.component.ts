import { Component, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/services/users.service';
import type { UserProfile } from '../../../core/models/api.types';

@Component({
  selector: 'app-settings-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings-profile.component.html',
  styleUrl: './settings-profile.component.scss',
})
export class SettingsProfileComponent implements OnInit {
  private readonly users = inject(UsersService);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly profile = signal<UserProfile | null>(null);

  fullName = '';
  timezone = 'UTC';
  locale = 'en';
  timezones: string[] = ['UTC'];

  ngOnInit(): void {
    this.timezones = this.buildTzList();
    void this.load();
  }

  private buildTzList(): string[] {
    try {
      const IntlAny = Intl as unknown as { supportedValuesOf?: (k: string) => string[] };
      if (typeof IntlAny.supportedValuesOf === 'function') {
        return IntlAny.supportedValuesOf('timeZone');
      }
    } catch {
      /* ignore */
    }
    return ['UTC'];
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const p = await firstValueFrom(this.users.getProfile());
      if (!p) return;
      this.profile.set(p);
      this.fullName = p.full_name ?? '';
      this.timezone = p.timezone || this.detectedTz();
      const allowed = ['en', 'ur', 'ar', 'fr', 'de', 'es', 'hi'];
      this.locale = allowed.includes(p.locale) ? p.locale : 'en';
    } finally {
      this.loading.set(false);
    }
  }

  private detectedTz(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
    } catch {
      return 'UTC';
    }
  }

  async onFile(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.busy.set(true);
    try {
      const r = await firstValueFrom(this.users.uploadAvatar(file));
      if (r?.avatar_url) {
        this.profile.update((p) => (p ? { ...p, avatar_url: r.avatar_url } : p));
        await this.auth.refreshUser();
      }
    } finally {
      this.busy.set(false);
      input.value = '';
    }
  }

  async removeAvatar(): Promise<void> {
    this.busy.set(true);
    try {
      await firstValueFrom(this.users.removeAvatar());
      this.profile.update((p) => (p ? { ...p, avatar_url: null } : p));
      await this.auth.refreshUser();
    } finally {
      this.busy.set(false);
    }
  }

  async saveProfile(): Promise<void> {
    this.busy.set(true);
    try {
      const updated = await firstValueFrom(
        this.users.updateProfile({
          full_name: this.fullName.trim(),
          timezone: this.timezone,
          locale: this.locale,
        })
      );
      if (updated) this.profile.set(updated);
      await this.auth.refreshUser();
    } finally {
      this.busy.set(false);
    }
  }
}
