import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private depth = 0;
  readonly active = signal(false);

  begin(): void {
    this.depth += 1;
    this.active.set(this.depth > 0);
  }

  end(): void {
    this.depth = Math.max(0, this.depth - 1);
    this.active.set(this.depth > 0);
  }
}
