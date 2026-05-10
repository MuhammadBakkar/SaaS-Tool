import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { API_BASE_URL } from '../../../core/tokens';
import { isStrongPassword, passwordValidationErrors } from '../../../shared/password-strength';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly apiBase = inject(API_BASE_URL);

  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  protected readonly submitting = signal(false);
  protected readonly sent = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);

  googleHref(): string {
    return `${this.apiBase.replace(/\/$/, '')}/auth/google`;
  }

  pwErrors(): string[] {
    return passwordValidationErrors(this.password);
  }

  canSubmit(): boolean {
    return (
      this.fullName.trim().length >= 2 &&
      this.email.includes('@') &&
      isStrongPassword(this.password) &&
      this.password === this.confirmPassword
    );
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    try {
      await this.auth.register({
        full_name: this.fullName.trim(),
        email: this.email.trim(),
        password: this.password,
        confirm_password: this.confirmPassword,
      });
      this.sent.set(true);
    } catch {
      /* toast */
    } finally {
      this.submitting.set(false);
    }
  }
}
