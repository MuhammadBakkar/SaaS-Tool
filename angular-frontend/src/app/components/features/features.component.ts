import { Component } from '@angular/core';
import { AnimateOnScrollDirective } from '../../shared/directives/animate-on-scroll.directive';

type Feature = {
  title: string;
  body: string;
  badge?: string;
};

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [AnimateOnScrollDirective],
  templateUrl: './features.component.html',
  styleUrl: './features.component.scss',
})
export class FeaturesComponent {
  readonly items: Feature[] = [
    {
      title: 'AI Text Ad Generator',
      body:
        'Generate Google, Facebook, Instagram & LinkedIn ads with perfect headlines, descriptions and CTAs. Multiple variations every time.',
      badge: 'Most Used',
    },
    {
      title: 'AI Image Creative Generator',
      body:
        'Create stunning ad banners in any size — Facebook, Instagram Stories, Google Display. Brand logo, colors, auto-applied.',
    },
    {
      title: 'AI Video Script Generator',
      body: 'Generate 30s, 60s, 90s video scripts with hook-story-CTA structure for YouTube, TikTok, and Reels.',
    },
    {
      title: 'Brand Profile System',
      body:
        'Save your brand voice, audience, and USP. Every ad generated stays perfectly on-brand without repeating yourself.',
    },
    {
      title: 'Bulk Ads Generator',
      body: 'Upload a CSV of products and generate hundreds of ads instantly. Perfect for e-commerce and agencies.',
      badge: 'Agency',
    },
    {
      title: 'Campaign Manager',
      body:
        'Organize all your ads into campaigns, track performance predictions, and export everything in one click.',
    },
  ];
}
