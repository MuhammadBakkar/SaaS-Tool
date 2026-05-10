import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { API_BASE_URL } from '../../../core/tokens';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly apiBase = inject(API_BASE_URL);

  email = '';
  password = '';
  rememberMe = false;
  protected readonly submitting = signal(false);
  protected readonly showPassword = signal(false);

  googleHref(): string {
    return `${this.apiBase.replace(/\/$/, '')}/auth/google`;
  }

  async submit(): Promise<void> {
    this.submitting.set(true);
    try {
      await this.auth.login(this.email, this.password, this.rememberMe);
      await this.router.navigateByUrl('/dashboard');
    } catch {
      /* toast from interceptor */
    } finally {
      this.submitting.set(false);
    }
  }
}
