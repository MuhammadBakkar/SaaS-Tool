import { AfterViewInit, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { HeroComponent } from '../components/hero/hero.component';
import { StatsBarComponent } from '../components/stats-bar/stats-bar.component';
import { HowItWorksComponent } from '../components/how-it-works/how-it-works.component';
import { FeaturesComponent } from '../components/features/features.component';
import { PlatformSupportComponent } from '../components/platform-support/platform-support.component';
import { PricingComponent } from '../components/pricing/pricing.component';
import { TestimonialsComponent } from '../components/testimonials/testimonials.component';
import { FaqComponent } from '../components/faq/faq.component';
import { CtaBannerComponent } from '../components/cta-banner/cta-banner.component';
import { FooterComponent } from '../components/footer/footer.component';
import { ToastService } from '../core/services/toast.service';
import { ScrollService } from '../core/services/scroll.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    NavbarComponent,
    HeroComponent,
    StatsBarComponent,
    HowItWorksComponent,
    FeaturesComponent,
    PlatformSupportComponent,
    PricingComponent,
    TestimonialsComponent,
    FaqComponent,
    CtaBannerComponent,
    FooterComponent,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements OnInit, AfterViewInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly scroll = inject(ScrollService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.scrollToPricingIfNeeded());
  }

  ngOnInit(): void {
    this.title.setTitle('AI Ads Generator — Create High-Converting Ads with AI');
    this.meta.updateTag({
      name: 'description',
      content:
        'Generate professional ad copy, image creatives, and video scripts for Google, Facebook, Instagram & LinkedIn using AI. Start free today.',
    });

    const deleted = this.route.snapshot.queryParamMap.get('deleted');
    if (deleted === 'true') {
      this.toast.success('Your account has been deleted.');
      if (typeof history !== 'undefined') {
        history.replaceState({}, '', '/');
      }
    }
  }

  ngAfterViewInit(): void {
    this.scrollToPricingIfNeeded();
  }

  private scrollToPricingIfNeeded(): void {
    const path = this.router.url.split('?')[0].split('#')[0];
    if (path !== '/pricing') return;
    requestAnimationFrame(() => {
      setTimeout(() => this.scroll.smoothScroll('pricing'), 0);
    });
  }
}
