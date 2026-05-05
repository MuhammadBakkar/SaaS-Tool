import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

const items: { path: string; label: string; emoji: string; danger?: boolean }[] = [
  { path: '/settings/profile', label: 'Profile', emoji: '👤' },
  { path: '/settings/security', label: 'Security', emoji: '🔐' },
  { path: '/settings/email', label: 'Email', emoji: '📧' },
  { path: '/settings/plan', label: 'Plan', emoji: '💳' },
  { path: '/settings/danger-zone', label: 'Danger Zone', emoji: '🗑', danger: true },
];

@Component({
  selector: 'app-settings-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="settings">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a routerLink="/dashboard" class="settings__crumb">Dashboard</a>
        <span class="settings__sep">/</span>
        <span class="settings__crumb settings__crumb--muted">Settings</span>
      </nav>
      <div class="settings__grid">
        <aside class="settings__aside" aria-label="Settings">
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="settings__side--active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="settings__side"
              [class.settings__side--danger]="item.danger"
            >
              <span aria-hidden="true">{{ item.emoji }}</span>
              {{ item.label }}
            </a>
          }
        </aside>
        <div class="settings__content">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
  styles: `
    .settings {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }
    .breadcrumb {
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
      color: #71717a;
    }
    .settings__crumb {
      color: inherit;
      text-decoration: none;
    }
    .settings__crumb:hover {
      color: #18181b;
    }
    .settings__crumb--muted {
      color: #18181b;
      font-weight: 500;
    }
    .settings__sep {
      margin: 0 0.35rem;
    }
    .settings__grid {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    @media (min-width: 768px) {
      .settings__grid {
        flex-direction: row;
        align-items: flex-start;
      }
      .settings__aside {
        width: 13rem;
        flex-shrink: 0;
        border-right: 1px solid #e4e4e7;
        padding-right: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
    }
    .settings__aside {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 0.25rem;
      border-bottom: 1px solid #e4e4e7;
      padding-bottom: 0.5rem;
    }
    @media (min-width: 768px) {
      .settings__aside {
        flex-direction: column;
        flex-wrap: nowrap;
        border-bottom: none;
        padding-bottom: 0;
      }
    }
    .settings__side {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.5rem 0.75rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #52525b;
      text-decoration: none;
      border-left: 4px solid transparent;
    }
    @media (max-width: 767px) {
      .settings__side {
        border-left: none;
        border-bottom: 2px solid transparent;
      }
    }
    .settings__side:hover {
      background: #fafafa;
    }
    .settings__side--active {
      color: #18181b;
      background: #f4f4f5;
      border-left-color: #18181b;
    }
    @media (max-width: 767px) {
      .settings__side--active {
        border-left-color: transparent;
        border-bottom-color: #18181b;
      }
    }
    .settings__side--danger {
      color: #b91c1c;
    }
    .settings__content {
      flex: 1;
      min-width: 0;
    }
  `,
})
export class SettingsLayoutComponent {
  readonly navItems = items;
}
