import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { SessionStateService } from '../services/session-state.service';

export const guestGuard: CanActivateFn = () => {
  const session = inject(SessionStateService);
  const router = inject(Router);
  if (session.isAuthenticated()) return router.createUrlTree(['/dashboard']);
  return true;
};
