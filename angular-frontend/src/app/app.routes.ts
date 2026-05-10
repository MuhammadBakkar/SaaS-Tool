import type { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'pricing',
    loadComponent: () => import('./landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'terms',
    loadComponent: () => import('./legal/terms/terms.component').then((m) => m.TermsComponent),
  },
  {
    path: 'privacy',
    loadComponent: () => import('./legal/privacy/privacy.component').then((m) => m.PrivacyComponent),
  },
  {
    path: 'refund',
    loadComponent: () => import('./legal/refund/refund.component').then((m) => m.RefundComponent),
  },
  { path: 'login', redirectTo: '/auth/login', pathMatch: 'full' },
  { path: 'register', redirectTo: '/auth/register', pathMatch: 'full' },
  { path: 'forgot-password', redirectTo: '/auth/forgot-password', pathMatch: 'full' },
  { path: 'reset-password', redirectTo: '/auth/reset-password', pathMatch: 'full' },
  { path: 'verify-email', redirectTo: '/auth/verify-email', pathMatch: 'full' },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
      },
      {
        path: 'forgot-password',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent
          ),
      },
      {
        path: 'reset-password',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password.component').then(
            (m) => m.ResetPasswordComponent
          ),
      },
      {
        path: 'verify-email',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/verify-email/verify-email.component').then((m) => m.VerifyEmailComponent),
      },
      {
        path: 'callback',
        loadComponent: () =>
          import('./features/auth/oauth-callback/oauth-callback.component').then((m) => m.OauthCallbackComponent),
      },
    ],
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/dashboard-layout.component').then((m) => m.DashboardLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard-home.component').then((m) => m.DashboardHomeComponent),
      },
    ],
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/dashboard-layout.component').then((m) => m.DashboardLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./layout/settings-layout.component').then((m) => m.SettingsLayoutComponent),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'profile' },
          {
            path: 'profile',
            loadComponent: () =>
              import('./features/settings/profile/settings-profile.component').then(
                (m) => m.SettingsProfileComponent
              ),
          },
          {
            path: 'security',
            loadComponent: () =>
              import('./features/settings/security/settings-security.component').then(
                (m) => m.SettingsSecurityComponent
              ),
          },
          {
            path: 'email',
            loadComponent: () =>
              import('./features/settings/email/settings-email.component').then(
                (m) => m.SettingsEmailComponent
              ),
          },
          {
            path: 'plan',
            loadComponent: () =>
              import('./features/settings/plan/settings-plan.component').then((m) => m.SettingsPlanComponent),
          },
          {
            path: 'danger-zone',
            loadComponent: () =>
              import('./features/settings/danger-zone/settings-danger-zone.component').then(
                (m) => m.SettingsDangerZoneComponent
              ),
          },
          {
            path: 'verify-email-change',
            loadComponent: () =>
              import('./features/settings/verify-email-change/verify-email-change.component').then(
                (m) => m.VerifyEmailChangeComponent
              ),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
