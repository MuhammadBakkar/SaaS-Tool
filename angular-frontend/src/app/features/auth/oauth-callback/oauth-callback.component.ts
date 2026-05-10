import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  templateUrl: './oauth-callback.component.html',
  styleUrl: './oauth-callback.component.scss',
})
export class OauthCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly err = signal<string | null>(null);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const refresh = this.route.snapshot.queryParamMap.get('refresh');
    if (!token || !refresh) {
      this.err.set('Missing tokens from provider.');
      return;
    }
    void this.finish(token, refresh);
  }

  private async finish(token: string, refresh: string): Promise<void> {
    try {
      await this.auth.setSessionFromTokens(token, refresh);
      await this.router.navigateByUrl('/dashboard');
    } catch (e) {
      this.err.set(e instanceof Error ? e.message : 'Could not complete sign-in');
    }
  }
}
