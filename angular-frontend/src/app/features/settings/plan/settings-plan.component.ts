import { Component, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UsersService } from '../../../core/services/users.service';
import type { UserProfile } from '../../../core/models/api.types';

@Component({
  selector: 'app-settings-plan',
  standalone: true,
  templateUrl: './settings-plan.component.html',
  styleUrl: './settings-plan.component.scss',
})
export class SettingsPlanComponent implements OnInit {
  private readonly users = inject(UsersService);
  protected readonly loading = signal(true);
  protected readonly profile = signal<UserProfile | null>(null);

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

  planName(): string {
    return this.profile()?.plan?.plan_name ?? 'free';
  }

  used(): number {
    return this.profile()?.plan?.credits_used ?? 0;
  }

  total(): number {
    return Math.max(1, this.profile()?.plan?.credits_total ?? 1);
  }

  pct(): number {
    return Math.min(100, Math.round((this.used() / this.total()) * 100));
  }

  badgeClass(name: string): string {
    if (name === 'agency') return 'badge badge--agency';
    if (name === 'pro') return 'badge badge--pro';
    if (name === 'starter') return 'badge badge--starter';
    return 'badge';
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '—';
    }
  }
}
