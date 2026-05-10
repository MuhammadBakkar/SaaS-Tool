import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import { UsersService } from '../../../core/services/users.service';
import type { UserProfile } from '../../../core/models/api.types';

@Component({
  selector: 'app-settings-email',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings-email.component.html',
  styleUrl: './settings-email.component.scss',
})
export class SettingsEmailComponent implements OnInit {
  private readonly users = inject(UsersService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly profile = signal<UserProfile | null>(null);
  protected readonly sent = signal(false);
  protected readonly sentTo = signal('');

  newEmail = '';
  password = '';

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

  backToForm(): void {
    this.sent.set(false);
    this.newEmail = '';
    this.password = '';
  }

  async submit(): Promise<void> {
    const p = this.profile();
    if (!p) return;
    if (p.auth_provider === 'email' && !this.password.trim()) {
      this.toast.error('Enter your password to confirm this change.');
      return;
    }
    this.busy.set(true);
    try {
      await firstValueFrom(
        this.users.requestEmailChange({
          new_email: this.newEmail.trim(),
          ...(p.auth_provider === 'email' && this.password.trim()
            ? { password: this.password }
            : {}),
        })
      );
      this.sentTo.set(this.newEmail.trim());
      this.sent.set(true);
      this.password = '';
      const fresh = await firstValueFrom(this.users.getProfile());
      this.profile.set(fresh);
    } finally {
      this.busy.set(false);
    }
  }
}
