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

  goSection(id: 'features' | 'how-it-works' | 'pricing' | 'faq', ev: Event): void {
    ev.preventDefault();
    const path = this.router.url.split('?')[0].split('#')[0];
    if (path !== '/' && path !== '') {
      void this.router.navigate(['/']).then(() => requestAnimationFrame(() => this.scroll.smoothScroll(id)));
    } else {
      this.scroll.smoothScroll(id);
    }
  }
}
