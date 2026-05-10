import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/services/users.service';

@Component({
  selector: 'app-verify-email-change',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './verify-email-change.component.html',
  styleUrl: './verify-email-change.component.scss',
})
export class VerifyEmailChangeComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly users = inject(UsersService);
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
      await firstValueFrom(this.users.verifyEmailChange(token));
      this.status.set('ok');
      await this.auth.refreshUser();
      window.setTimeout(() => void this.router.navigateByUrl('/settings/email'), 2000);
    } catch {
      this.status.set('err');
    }
  }
}
