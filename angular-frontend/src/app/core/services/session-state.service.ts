import { Injectable, computed, signal } from '@angular/core';
import type { ApiUser } from '../models/api.types';

@Injectable({ providedIn: 'root' })
export class SessionStateService {
  readonly user = signal<ApiUser | null>(null);
  readonly booted = signal(false);
  readonly isAuthenticated = computed(() => Boolean(this.user()));

  setUser(user: ApiUser | null): void {
    this.user.set(user);
  }

  clear(): void {
    this.user.set(null);
  }

  setBooted(value: boolean): void {
    this.booted.set(value);
  }
}
