import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { map, firstValueFrom } from 'rxjs';
import type { ApiEnvelope } from '../../../core/models/api.types';
import { unwrapEnvelope } from '../../../core/models/api.types';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly http = inject(HttpClient);

  email = '';
  protected readonly submitting = signal(false);

  async submit(): Promise<void> {
    this.submitting.set(true);
    try {
      await firstValueFrom(
        this.http
          .post<ApiEnvelope<{ message: string }>>('/auth/forgot-password', { email: this.email.trim() })
          .pipe(map((b) => unwrapEnvelope(b)))
      );
    } catch {
      /* toast */
    } finally {
      this.submitting.set(false);
    }
  }
}
