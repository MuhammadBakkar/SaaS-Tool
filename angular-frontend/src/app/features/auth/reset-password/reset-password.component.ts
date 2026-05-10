import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import type { ApiEnvelope } from '../../../core/models/api.types';
import { unwrapEnvelope } from '../../../core/models/api.types';
import { isStrongPassword, passwordValidationErrors } from '../../../shared/password-strength';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  token = '';
  password = '';
  confirm = '';
  protected readonly submitting = signal(false);

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  pwErrors(): string[] {
    return passwordValidationErrors(this.password);
  }

  canSubmit(): boolean {
    return Boolean(this.token) && isStrongPassword(this.password) && this.password === this.confirm;
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    try {
      await firstValueFrom(
        this.http
          .post<ApiEnvelope<{ message: string }>>('/auth/reset-password', {
            token: this.token,
            password: this.password,
          })
          .pipe(map((b) => unwrapEnvelope(b)))
      );
      await this.router.navigateByUrl('/auth/login');
    } catch {
      /* toast */
    } finally {
      this.submitting.set(false);
    }
  }
}
