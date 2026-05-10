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
  templateUrl: './settings-layout.component.html',
  styleUrl: './settings-layout.component.scss',
})
export class SettingsLayoutComponent {
  readonly navItems = items;
}
