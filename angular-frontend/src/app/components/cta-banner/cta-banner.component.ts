import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '../../core/constants/contact';
import { AnimateOnScrollDirective } from '../../shared/directives/animate-on-scroll.directive';

@Component({
  selector: 'app-cta-banner',
  standalone: true,
  imports: [RouterLink, AnimateOnScrollDirective],
  templateUrl: './cta-banner.component.html',
  styleUrl: './cta-banner.component.scss',
})
export class CtaBannerComponent {
  readonly supportMailto = SUPPORT_MAILTO;
  readonly supportEmail = SUPPORT_EMAIL;
}
