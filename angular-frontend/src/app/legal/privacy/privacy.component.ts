import { Component, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { PRIVACY_EMAIL, PRIVACY_MAILTO } from '../../core/constants/contact';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [NavbarComponent, FooterComponent, RouterLink],
  templateUrl: './privacy.component.html',
})
export class PrivacyComponent implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  readonly privacyMailto = PRIVACY_MAILTO;
  readonly privacyEmail = PRIVACY_EMAIL;

  ngOnInit(): void {
    this.title.setTitle('Privacy Policy — AI Ads Generator');
    this.meta.updateTag({
      name: 'description',
      content: 'Privacy Policy for AI Ads Generator: how we collect, use, and protect your data.',
    });
  }
}
