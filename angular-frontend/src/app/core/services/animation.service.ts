import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ScrollObserveCallback = (entry: IntersectionObserverEntry) => void;

@Injectable({ providedIn: 'root' })
export class AnimationService {
  private readonly platformId = inject(PLATFORM_ID);

  setupObserver(
    element: Element,
    callback: ScrollObserveCallback,
    options?: IntersectionObserverInit
  ): () => void {
    if (!isPlatformBrowser(this.platformId) || typeof IntersectionObserver === 'undefined') {
      callback({ isIntersecting: true } as IntersectionObserverEntry);
      return () => undefined;
    }
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) callback(e);
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px', ...options });
    obs.observe(element);
    return () => obs.disconnect();
  }

  countUp(element: HTMLElement, target: number, durationMs: number, formatter?: (n: number) => string): void {
    if (!isPlatformBrowser(this.platformId)) {
      element.textContent = formatter ? formatter(target) : String(target);
      return;
    }
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) * (1 - t);
      const val = t >= 1 ? target : Math.round(from + (target - from) * eased);
      element.textContent = formatter ? formatter(val) : String(val);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
