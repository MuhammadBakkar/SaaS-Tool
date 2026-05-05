import { Component, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UsersService } from '../../../core/services/users.service';
import type { UserProfile } from '../../../core/models/api.types';

@Component({
  selector: 'app-settings-plan',
  standalone: true,
  template: `
    <div class="page">
      <header class="page__head">
        <h1>Plan</h1>
        <p>Usage and billing (Stripe coming soon).</p>
      </header>
      @if (loading()) {
        <p class="muted">Loading…</p>
      } @else {
        @if (profile(); as p) {
          <div class="grid">
            <div>
              <h3>Current plan</h3>
              <span class="badge" [class]="badgeClass(planName())">{{ planName() }}</span>
            </div>
            <div>
              <h3>Credits</h3>
              <p class="muted">
                {{ used() }} of {{ total() }} credits used ({{ pct() }}%)
              </p>
              <div class="bar">
                <div class="bar__fill" [class.warn]="pct() >= 80" [style.width.%]="pct()"></div>
              </div>
            </div>
            <div class="muted small">
              <p>
                <strong class="dark">Resets on:</strong>
                {{ formatDate(p.plan?.current_period_end ?? null) }}
              </p>
              <p>
                <strong class="dark">Member since:</strong>
                {{ formatDate(p.created_at) }}
              </p>
            </div>
          </div>
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
    .grid {
      max-width: 32rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
      margin-top: 1rem;
    }
    h3 {
      font-size: 0.875rem;
      font-weight: 500;
      color: #71717a;
      margin: 0 0 0.5rem;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: capitalize;
      background: #e4e4e7;
      color: #27272a;
    }
    .badge--agency {
      background: #ede9fe;
      color: #5b21b6;
    }
    .badge--pro {
      background: #dbeafe;
      color: #1e3a8a;
    }
    .badge--starter {
      background: #cffafe;
      color: #155e75;
    }
    .bar {
      height: 0.5rem;
      border-radius: 9999px;
      background: #e4e4e7;
      overflow: hidden;
      margin-top: 0.5rem;
    }
    .bar__fill {
      height: 100%;
      border-radius: 9999px;
      background: #10b981;
    }
    .bar__fill.warn {
      background: #f59e0b;
    }
    .muted {
      color: #52525b;
      font-size: 0.875rem;
      margin: 0.25rem 0 0;
    }
    .small {
      font-size: 0.875rem;
    }
    .dark {
      color: #18181b;
    }
  `,
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
