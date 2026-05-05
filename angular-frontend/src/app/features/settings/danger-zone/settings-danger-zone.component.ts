import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/services/users.service';
import type { UserProfile } from '../../../core/models/api.types';

@Component({
  selector: 'app-settings-danger-zone',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <header class="page__head">
        <h1>Danger zone</h1>
        <p>Irreversible actions for your account.</p>
      </header>
      <div class="box">
        <h2>Delete account</h2>
        <p>
          This will permanently delete your account and associated data. This action cannot be undone.
        </p>
        <button type="button" class="btn-danger" (click)="modalOpen.set(true)">Delete my account</button>
      </div>
      @if (modalOpen()) {
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal__backdrop" (click)="modalOpen.set(false)"></div>
          <div class="modal__panel">
            <h3>Delete your account</h3>
            <p class="warn">This permanently deletes your account and data. This cannot be undone.</p>
            @if (profile(); as prof) {
              @if (prof.auth_provider === 'google') {
                <label class="field">
                  <span>Type DELETE to confirm</span>
                  <input [(ngModel)]="confirmText" name="ct" autocomplete="off" class="mono" />
                </label>
              } @else {
                <label class="field">
                  <span>Enter your password to confirm</span>
                  <input type="password" [(ngModel)]="password" name="pw" autocomplete="current-password" />
                </label>
              }
            }
            <div class="modal__actions">
              <button type="button" class="btn-muted" (click)="modalOpen.set(false)">Cancel</button>
              <button
                type="button"
                class="btn-go"
                [disabled]="busy() || !canSubmit()"
                (click)="submitDelete()"
              >
                {{ busy() ? 'Deleting…' : 'Delete account' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .page__head h1 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #991b1b;
      margin: 0;
    }
    .page__head p {
      margin: 0.25rem 0 0;
      font-size: 0.875rem;
      color: #52525b;
    }
    .box {
      max-width: 32rem;
      margin-top: 1.5rem;
      padding: 1.5rem;
      border-radius: 0.75rem;
      border: 2px solid #fecaca;
      background: rgba(254, 242, 242, 0.5);
    }
    .box h2 {
      margin: 0;
      font-size: 1.125rem;
      color: #7f1d1d;
    }
    .box p {
      margin: 0.5rem 0 0;
      font-size: 0.875rem;
      color: rgba(127, 29, 29, 0.9);
    }
    .btn-danger {
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      border: 2px solid #dc2626;
      background: transparent;
      font-size: 0.875rem;
      font-weight: 600;
      color: #b91c1c;
      cursor: pointer;
    }
    .btn-danger:hover {
      background: #fee2e2;
    }
    .modal {
      position: fixed;
      inset: 0;
      z-index: 1200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal__backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.35);
    }
    .modal__panel {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 24rem;
      background: #fff;
      border-radius: 0.5rem;
      padding: 1.25rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    }
    .modal__panel h3 {
      margin: 0 0 0.5rem;
      font-size: 1rem;
    }
    .warn {
      font-size: 0.8125rem;
      padding: 0.5rem 0.75rem;
      border-radius: 0.375rem;
      border: 1px solid #fecaca;
      background: #fef2f2;
      color: #7f1d1d;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-top: 1rem;
      font-size: 0.875rem;
      font-weight: 500;
    }
    .field input {
      border: 1px solid #d4d4d8;
      border-radius: 0.375rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
    }
    .mono {
      font-family: ui-monospace, monospace;
    }
    .modal__actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1.25rem;
    }
    .btn-muted {
      padding: 0.4rem 0.75rem;
      border-radius: 0.375rem;
      border: 1px solid #d4d4d8;
      background: #fff;
      font-size: 0.875rem;
      cursor: pointer;
    }
    .btn-go {
      padding: 0.4rem 0.75rem;
      border-radius: 0.375rem;
      border: none;
      background: #dc2626;
      color: #fff;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
    }
    .btn-go:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
})
export class SettingsDangerZoneComponent implements OnInit {
  private readonly users = inject(UsersService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly profile = signal<UserProfile | null>(null);
  protected readonly modalOpen = signal(false);
  protected readonly busy = signal(false);
  password = '';
  confirmText = '';

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const p = await firstValueFrom(this.users.getProfile());
    this.profile.set(p);
  }

  canSubmit(): boolean {
    const p = this.profile();
    if (!p) return false;
    if (p.auth_provider === 'google') return this.confirmText === 'DELETE';
    return this.password.trim().length > 0;
  }

  async submitDelete(): Promise<void> {
    const p = this.profile();
    if (!p || !this.canSubmit()) return;
    this.busy.set(true);
    try {
      if (p.auth_provider === 'google') {
        await firstValueFrom(this.users.deleteAccount({ confirmation: this.confirmText }));
      } else {
        await firstValueFrom(this.users.deleteAccount({ password: this.password }));
      }
      this.modalOpen.set(false);
      await this.auth.logout({ skipRedirect: true });
      await this.router.navigateByUrl('/?deleted=true');
    } catch {
      /* toast */
    } finally {
      this.busy.set(false);
    }
  }
}
