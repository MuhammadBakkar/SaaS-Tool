import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnimateOnScrollDirective } from '../../shared/directives/animate-on-scroll.directive';

type PlanRow = { ok: boolean; text: string };

type Plan = {
  id: string;
  name: string;
  monthly: number;
  yearly: number;
  credits: string;
  rows: PlanRow[];
  cta: string;
  accent?: boolean;
  badge?: string;
};

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [RouterLink, AnimateOnScrollDirective],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss',
})
export class PricingComponent {
  readonly yearly = signal(false);

  readonly plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      monthly: 0,
      yearly: 0,
      credits: '5 credits/month',
      cta: 'Get Started Free',
      rows: [
        { ok: true, text: '5 AI Text Ads per month' },
        { ok: true, text: '3 Image Creatives (watermarked)' },
        { ok: true, text: '1 Brand Profile' },
        { ok: true, text: 'Basic templates' },
        { ok: false, text: 'Video Scripts' },
        { ok: false, text: 'Campaign Manager' },
        { ok: false, text: 'Bulk Generator' },
      ],
    },
    {
      id: 'starter',
      name: 'Starter',
      monthly: 19,
      yearly: 15,
      credits: '100 credits/month',
      cta: 'Start Starter Plan',
      rows: [
        { ok: true, text: '50 AI Text Ads/month' },
        { ok: true, text: '20 Image Creatives' },
        { ok: true, text: '10 Video Scripts' },
        { ok: true, text: '3 Brand Profiles' },
        { ok: true, text: 'Campaign Manager' },
        { ok: true, text: '3 Languages' },
        { ok: true, text: 'Clean exports (no watermark)' },
        { ok: false, text: 'Bulk Generator' },
        { ok: false, text: 'Competitor Analysis' },
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      monthly: 49,
      yearly: 39,
      credits: '500 credits/month',
      cta: 'Start Pro Plan',
      accent: true,
      badge: 'Most Popular',
      rows: [
        { ok: true, text: '250 AI Text Ads/month' },
        { ok: true, text: '100 Image Creatives' },
        { ok: true, text: '50 Video Scripts' },
        { ok: true, text: '10 Brand Profiles' },
        { ok: true, text: 'Bulk Generator (50 ads)' },
        { ok: true, text: 'Competitor Analysis (5/mo)' },
        { ok: true, text: 'Performance Prediction' },
        { ok: true, text: '10 Languages' },
        { ok: true, text: '2 Team Members' },
      ],
    },
    {
      id: 'agency',
      name: 'Agency',
      monthly: 149,
      yearly: 119,
      credits: '2000 credits/month',
      cta: 'Start Agency Plan',
      rows: [
        { ok: true, text: 'Unlimited Text Ads' },
        { ok: true, text: '500 Image Creatives' },
        { ok: true, text: '200 Video Scripts' },
        { ok: true, text: 'Unlimited Brand Profiles' },
        { ok: true, text: 'Unlimited Bulk Generator' },
        { ok: true, text: 'All 30+ Languages' },
        { ok: true, text: '10 Team Members' },
        { ok: true, text: 'White Label option' },
        { ok: true, text: 'API Access' },
        { ok: true, text: 'Dedicated Support' },
      ],
    },
  ];

  readonly priceLabel = computed(() => (this.yearly() ? 'year' : 'month'));

  toggleYearly(value: boolean): void {
    this.yearly.set(value);
  }

  displayPrice(plan: Plan): string {
    const v = this.yearly() ? plan.yearly : plan.monthly;
    if (v === 0) return '$0';
    return `$${v}`;
  }

  /** Free plan is always shown per month in the UI. */
  periodLabel(plan: Plan): string {
    if (plan.id === 'free') return 'month';
    return this.priceLabel();
  }
}
