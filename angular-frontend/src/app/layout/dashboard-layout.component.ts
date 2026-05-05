import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <header class="shell__header">
        <nav class="shell__nav" aria-label="Main">
          <a
            routerLink="/dashboard"
            routerLinkActive="shell__link--active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="shell__link"
            >Dashboard</a
          >
          <a routerLink="/settings/profile" routerLinkActive="shell__link--active" class="shell__link"
            >Settings</a
          >
        </nav>
        <button type="button" class="shell__logout" [disabled]="loggingOut()" (click)="onLogout()">
          @if (loggingOut()) {
            <span>Signing out…</span>
          } @else {
            <span>Log out</span>
          }
        </button>
      </header>
      <main class="shell__main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .shell {
      min-height: 100vh;
      background: #fafafa;
    }
    .shell__header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e4e4e7;
      background: #fff;
      max-width: 80rem;
      margin: 0 auto;
    }
    .shell__nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      font-size: 0.875rem;
    }
    .shell__link {
      padding: 0.35rem 0.75rem;
      border-radius: 0.375rem;
      color: #3f3f46;
      text-decoration: none;
      font-weight: 500;
    }
    .shell__link:hover {
      background: #f4f4f5;
    }
    .shell__link--active {
      background: #18181b;
      color: #fff;
    }
    .shell__logout {
      font-size: 0.875rem;
      padding: 0.35rem 0.75rem;
      border-radius: 0.375rem;
      border: 1px solid #d4d4d8;
      background: #fff;
      color: #27272a;
      cursor: pointer;
    }
    .shell__logout:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .shell__main {
      max-width: 80rem;
      margin: 0 auto;
    }
  `,
})
export class DashboardLayoutComponent {
  private readonly auth = inject(AuthService);
  protected readonly loggingOut = signal(false);

  async onLogout(): Promise<void> {
    this.loggingOut.set(true);
    try {
      await this.auth.logout();
    } finally {
      this.loggingOut.set(false);
    }
  }
}
