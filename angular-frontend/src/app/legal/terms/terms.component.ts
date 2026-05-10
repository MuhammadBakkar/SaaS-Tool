import { Component, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '../../core/constants/contact';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [NavbarComponent, FooterComponent, RouterLink],
  templateUrl: './terms.component.html',
})
export class TermsComponent implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  readonly supportMailto = SUPPORT_MAILTO;
  readonly supportEmail = SUPPORT_EMAIL;

  ngOnInit(): void {
    this.title.setTitle('Terms of Service — AI Ads Generator');
    this.meta.updateTag({
      name: 'description',
      content: 'Terms of Service for AI Ads Generator subscription and AI ad generation platform.',
    });
  }
}
