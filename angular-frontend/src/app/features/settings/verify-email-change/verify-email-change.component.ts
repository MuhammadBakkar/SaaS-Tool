import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { UsersService } from '../../../core/services/users.service';

@Component({
  selector: 'app-verify-email-change',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1>Verify email change</h1>
      @if (status() === 'idle') {
        <p class="muted">Confirming your new email…</p>
      } @else if (status() === 'ok') {
        <p class="ok">Email updated. Redirecting…</p>
      } @else {
        <p class="err">
          Invalid or expired link. Please request a new email change from
          <a routerLink="/settings/email">Email settings</a>.
        </p>
      }
    </div>
  `,
  styles: `
    h1 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 1rem;
    }
    .muted {
      font-size: 0.875rem;
      color: #52525b;
    }
    .ok {
      font-size: 0.875rem;
      color: #166534;
    }
    .err {
      font-size: 0.875rem;
      color: #b91c1c;
    }
    a {
      color: inherit;
      font-weight: 600;
    }
  `,
})
export class VerifyEmailChangeComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly users = inject(UsersService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly status = signal<'idle' | 'ok' | 'err'>('idle');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.status.set('err');
      return;
    }
    void this.run(token);
  }

  private async run(token: string): Promise<void> {
    try {
      await firstValueFrom(this.users.verifyEmailChange(token));
      this.status.set('ok');
      this.toast.success('Email updated successfully.');
      await this.auth.refreshUser();
      window.setTimeout(() => void this.router.navigateByUrl('/settings/email'), 2000);
    } catch (e) {
      this.status.set('err');
      this.toast.error(e instanceof Error ? e.message : 'Invalid or expired link.');
    }
  }
}
