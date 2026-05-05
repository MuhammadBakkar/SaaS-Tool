import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  template: `
    <div class="wrap">
      @if (status() === 'idle') {
        <p>Verifying your email…</p>
      } @else if (status() === 'ok') {
        <p class="ok">Email verified. Redirecting…</p>
      } @else {
        <p class="err">Invalid or expired token.</p>
      }
    </div>
  `,
  styles: `
    .wrap {
      max-width: 24rem;
      margin: 3rem auto;
      padding: 1rem;
      font-size: 0.875rem;
      color: #52525b;
    }
    .ok {
      color: #166534;
    }
    .err {
      color: #b91c1c;
    }
  `,
})
export class VerifyEmailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

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
      const data = await this.auth.verifyEmail(token);
      await this.auth.setSessionFromTokens(data.access_token, data.refresh_token);
      this.status.set('ok');
      await this.router.navigateByUrl('/dashboard');
    } catch {
      this.status.set('err');
    }
  }
}
