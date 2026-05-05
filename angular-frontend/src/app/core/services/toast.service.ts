import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export type ToastMessage = { id: number; kind: ToastKind; text: string };

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  readonly messages = signal<ToastMessage[]>([]);

  success(text: string): void {
    this.push('success', text);
  }

  error(text: string): void {
    this.push('error', text);
  }

  info(text: string): void {
    this.push('info', text);
  }

  dismiss(id: number): void {
    this.messages.update((list) => list.filter((t) => t.id !== id));
  }

  private push(kind: ToastKind, text: string): void {
    const id = ++this.seq;
    this.messages.update((list) => [...list, { id, kind, text }]);
    window.setTimeout(() => this.dismiss(id), 4500);
  }
}
