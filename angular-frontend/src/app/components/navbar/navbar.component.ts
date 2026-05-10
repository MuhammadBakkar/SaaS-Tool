import { Component, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ScrollService } from '../../core/services/scroll.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  private readonly router = inject(Router);
  private readonly scroll = inject(ScrollService);

  readonly scrolled = signal(false);
  readonly menuOpen = signal(false);

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.menuOpen.set(false));
  }

  @HostListener('window:scroll')
  onWinScroll(): void {
    this.scrolled.set(typeof window !== 'undefined' && window.scrollY > 50);
  }

  isActive(section: 'features' | 'how-it-works' | 'pricing' | 'faq'): boolean {
    const path = this.router.url.split('?')[0].split('#')[0];
    if (section === 'pricing' && path === '/pricing') return true;
    return this.scroll.activeSection() === section;
  }

  onPricingNav(ev: MouseEvent): void {
    if (this.router.url.split('?')[0].split('#')[0] === '/pricing') {
      ev.preventDefault();
      this.scroll.smoothScroll('pricing');
    }
    this.menuOpen.set(false);
  }

  goSection(id: 'features' | 'how-it-works' | 'faq', ev: Event): void {
    ev.preventDefault();
    const path = this.router.url.split('?')[0].split('#')[0];
    const onHome = path === '/' || path === '';
    const onPricingRoute = path === '/pricing';

    if (onPricingRoute) {
      void this.router.navigate(['/']).then(() => {
        requestAnimationFrame(() => this.scroll.smoothScroll(id));
      });
      this.menuOpen.set(false);
      return;
    }

    if (!onHome) {
      void this.router.navigate(['/']).then(() => {
        requestAnimationFrame(() => this.scroll.smoothScroll(id));
      });
    } else {
      this.scroll.smoothScroll(id);
    }
    this.menuOpen.set(false);
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }
}
