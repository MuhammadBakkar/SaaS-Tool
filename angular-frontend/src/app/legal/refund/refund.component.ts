import { Component, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '../../core/constants/contact';

@Component({
  selector: 'app-refund',
  standalone: true,
  imports: [NavbarComponent, FooterComponent, RouterLink],
  templateUrl: './refund.component.html',
})
export class RefundComponent implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  readonly supportMailto = SUPPORT_MAILTO;
  readonly supportEmail = SUPPORT_EMAIL;

  ngOnInit(): void {
    this.title.setTitle('Refund Policy — AI Ads Generator');
    this.meta.updateTag({
      name: 'description',
      content: 'Refund and money-back policy for AI Ads Generator paid plans.',
    });
  }
}
