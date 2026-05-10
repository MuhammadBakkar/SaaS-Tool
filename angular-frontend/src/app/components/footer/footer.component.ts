import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SUPPORT_MAILTO } from '../../core/constants/contact';
import { ScrollService } from '../../core/services/scroll.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  private readonly router = inject(Router);
  private readonly scroll = inject(ScrollService);
  readonly supportMailto = SUPPORT_MAILTO;

  onPricingNav(ev: MouseEvent): void {
    if (this.router.url.split('?')[0].split('#')[0] === '/pricing') {
      ev.preventDefault();
      this.scroll.smoothScroll('pricing');
    }
  }

  goSection(id: 'features' | 'how-it-works' | 'faq', ev: Event): void {
    ev.preventDefault();
    const path = this.router.url.split('?')[0].split('#')[0];
    const onHome = path === '/' || path === '';
    const onPricingRoute = path === '/pricing';

    if (onPricingRoute) {
      void this.router.navigate(['/']).then(() => requestAnimationFrame(() => this.scroll.smoothScroll(id)));
      return;
    }

    if (!onHome) {
      void this.router.navigate(['/']).then(() => requestAnimationFrame(() => this.scroll.smoothScroll(id)));
    } else {
      this.scroll.smoothScroll(id);
    }
  }
}
