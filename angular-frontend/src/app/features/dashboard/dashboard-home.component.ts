import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="dash">
      <h1>Dashboard</h1>
      <p class="muted">
        Signed in as <strong>{{ auth.user()?.email }}</strong>
      </p>
      @if (auth.user()?.plan; as plan) {
        <p class="muted">
          Plan: {{ plan.plan_name }} — credits {{ plan.credits_used }}/{{ plan.credits_total }}
        </p>
      }
      <div class="actions">
        <a routerLink="/settings/profile" class="btn btn--primary">Account settings</a>
        <a routerLink="/" class="btn btn--outline">Home</a>
      </div>
    </div>
  `,
  styles: `
    .dash {
      padding: 2rem 1rem;
      max-width: 42rem;
      margin: 0 auto;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 1rem;
    }
    .muted {
      font-size: 0.875rem;
      color: #52525b;
      margin: 0.5rem 0;
    }
    .actions {
      margin-top: 2rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .btn {
      display: inline-flex;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
    }
    .btn--primary {
      background: #18181b;
      color: #fff;
    }
    .btn--outline {
      border: 1px solid #d4d4d8;
      color: #18181b;
    }
  `,
})
export class DashboardHomeComponent {
  protected readonly auth = inject(AuthService);
}
