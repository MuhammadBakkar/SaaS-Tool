import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/services/users.service';
import type { UserProfile } from '../../../core/models/api.types';

@Component({
  selector: 'app-settings-danger-zone',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings-danger-zone.component.html',
  styleUrl: './settings-danger-zone.component.scss',
})
export class SettingsDangerZoneComponent implements OnInit {
  private readonly users = inject(UsersService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly profile = signal<UserProfile | null>(null);
  protected readonly modalOpen = signal(false);
  protected readonly busy = signal(false);
  password = '';
  confirmText = '';

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const p = await firstValueFrom(this.users.getProfile());
    this.profile.set(p);
  }

  canSubmit(): boolean {
    const p = this.profile();
    if (!p) return false;
    if (p.auth_provider === 'google') return this.confirmText === 'DELETE';
    return this.password.trim().length > 0;
  }

  async submitDelete(): Promise<void> {
    const p = this.profile();
    if (!p || !this.canSubmit()) return;
    this.busy.set(true);
    try {
      if (p.auth_provider === 'google') {
        await firstValueFrom(this.users.deleteAccount({ confirmation: this.confirmText }));
      } else {
        await firstValueFrom(this.users.deleteAccount({ password: this.password }));
      }
      this.modalOpen.set(false);
      await this.auth.logout({ skipRedirect: true });
      await this.router.navigateByUrl('/?deleted=true');
    } catch {
      /* toast */
    } finally {
      this.busy.set(false);
    }
  }
}
