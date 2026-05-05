import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { SessionStateService } from '../services/session-state.service';

export const authGuard: CanActivateFn = () => {
  const session = inject(SessionStateService);
  const router = inject(Router);
  if (!session.booted()) return router.createUrlTree(['/login']);
  if (session.isAuthenticated()) return true;
  return router.createUrlTree(['/login']);
};
