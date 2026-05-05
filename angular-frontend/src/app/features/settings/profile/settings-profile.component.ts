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
  template: `
    <div class="page">
      <header class="page__head">
        <h1>Profile</h1>
        <p>Photo and display preferences.</p>
      </header>
      @if (loading()) {
        <p class="muted">Loading…</p>
      } @else {
        @if (profile(); as p) {
          <section>
            <h2>Profile photo</h2>
            @if (p.avatar_url) {
              <img [src]="p.avatar_url" alt="" class="avatar" width="96" height="96" />
            }
            <div class="row">
              <input type="file" accept="image/*" (change)="onFile($event)" />
              @if (p.avatar_url) {
                <button type="button" class="linkish" (click)="removeAvatar()" [disabled]="busy()">
                  Remove
                </button>
              }
            </div>
          </section>
          <section>
            <h2>Details</h2>
            <form (ngSubmit)="saveProfile()" class="form">
              <label class="field">
                <span>Full name</span>
                <input type="text" [(ngModel)]="fullName" name="fn" required minlength="2" />
              </label>
              <label class="field">
                <span>Timezone</span>
                <select [(ngModel)]="timezone" name="tz">
                  @for (z of timezones; track z) {
                    <option [value]="z">{{ z }}</option>
                  }
                </select>
              </label>
              <label class="field">
                <span>Locale</span>
                <select [(ngModel)]="locale" name="loc">
                  <option value="en">en</option>
                  <option value="ur">ur</option>
                  <option value="ar">ar</option>
                  <option value="fr">fr</option>
                  <option value="de">de</option>
                  <option value="es">es</option>
                  <option value="hi">hi</option>
                </select>
              </label>
              <button type="submit" class="btn" [disabled]="busy()">Save</button>
            </form>
          </section>
        }
      }
    </div>
  `,
  styles: `
    .page {
      padding-bottom: 2rem;
    }
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
      margin-top: 2rem;
    }
    h2 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #27272a;
      margin: 0 0 0.75rem;
    }
    .avatar {
      border-radius: 9999px;
      object-fit: cover;
      margin-bottom: 0.75rem;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
    }
    .linkish {
      border: none;
      background: none;
      color: #b91c1c;
      cursor: pointer;
      font-size: 0.875rem;
      text-decoration: underline;
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
    .field input,
    .field select {
      border: 1px solid #d4d4d8;
      border-radius: 0.375rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
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
  `,
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
