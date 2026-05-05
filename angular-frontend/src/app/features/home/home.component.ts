import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="home">
      <h1>AI Ads Generator</h1>
      <p class="home__lead">
        Angular frontend with your PostgreSQL-backed Express API. Use the links below to sign in or register.
      </p>
      <div class="home__actions">
        <a routerLink="/login" class="btn btn--primary">Login</a>
        <a routerLink="/register" class="btn btn--outline">Register</a>
        <a routerLink="/dashboard" class="btn btn--outline">Dashboard</a>
        <a routerLink="/settings/profile" class="btn btn--outline">Settings</a>
      </div>
    </main>
  `,
  styles: `
    .home {
      margin: 0 auto;
      min-height: 100vh;
      max-width: 32rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 1.5rem;
      padding: 2rem;
    }
    h1 {
      font-size: 1.875rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      margin: 0;
    }
    .home__lead {
      margin: 0;
      color: #52525b;
      line-height: 1.5;
    }
    .home__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
    }
    .btn--primary {
      background: #18181b;
      color: #fff;
    }
    .btn--outline {
      border: 1px solid #d4d4d8;
      color: #18181b;
      background: #fff;
    }
  `,
})
export class HomeComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  ngOnInit(): void {
    const deleted = this.route.snapshot.queryParamMap.get('deleted');
    if (deleted === 'true') {
      this.toast.success('Your account has been deleted.');
      if (typeof history !== 'undefined') {
        history.replaceState({}, '', '/');
      }
    }
  }
}
