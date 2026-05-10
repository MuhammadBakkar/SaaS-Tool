import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { fromEvent } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

const SECTION_IDS = ['features', 'how-it-works', 'pricing', 'faq'] as const;

@Injectable({ providedIn: 'root' })
export class ScrollService {
  private readonly doc = inject(DOCUMENT);
  readonly activeSection = signal<(typeof SECTION_IDS)[number] | null>(null);

  constructor() {
    if (typeof window === 'undefined') return;
    fromEvent(window, 'scroll', { passive: true })
      .pipe(throttleTime(80, undefined, { leading: true, trailing: true }))
      .subscribe(() => this.updateActiveSection());
    this.updateActiveSection();
  }

  smoothScroll(elementId: string): void {
    const el = this.doc.getElementById(elementId);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  getCurrentSection(): (typeof SECTION_IDS)[number] | null {
    return this.activeSection();
  }

  private updateActiveSection(): void {
    const win = this.doc.defaultView;
    if (!win) return;
    const mid = win.innerHeight * 0.28;
    let best: (typeof SECTION_IDS)[number] | null = null;
    let bestDist = Infinity;
    for (const id of SECTION_IDS) {
      const el = this.doc.getElementById(id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const dist = Math.abs(rect.top - mid);
      if (rect.top <= mid + 120 && rect.bottom > mid && dist < bestDist) {
        bestDist = dist;
        best = id;
      }
    }
    this.activeSection.set(best);
  }
}
