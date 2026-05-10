import { Component, signal } from '@angular/core';
import { animate, AUTO_STYLE, state, style, transition, trigger } from '@angular/animations';
import { AnimateOnScrollDirective } from '../../shared/directives/animate-on-scroll.directive';

type FaqItem = { q: string; a: string };

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [AnimateOnScrollDirective],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
  animations: [
    trigger('faqPanel', [
      state(
        'closed',
        style({
          height: '0',
          opacity: 0,
          paddingTop: 0,
          paddingBottom: 0,
          overflow: 'hidden',
        })
      ),
      state(
        'open',
        style({
          height: AUTO_STYLE,
          opacity: 1,
          paddingTop: '0.75rem',
          paddingBottom: '1rem',
          overflow: 'hidden',
        })
      ),
      transition('closed => open', [animate('280ms cubic-bezier(0.4, 0, 0.2, 1)')]),
      transition('open => closed', [animate('220ms cubic-bezier(0.4, 0, 0.2, 1)')]),
    ]),
  ],
})
export class FaqComponent {
  readonly openIndex = signal<number | null>(0);

  readonly items: FaqItem[] = [
    {
      q: 'What is a credit and how does it work?',
      a: 'A credit is the unit we use to measure AI usage. Each action costs a different number of credits: generating text ads = 1 credit, image creatives = 3 credits, video scripts = 2 credits. Your plan comes with a monthly credit allowance that resets every billing cycle.',
    },
    {
      q: 'Can I try before I buy?',
      a: "Yes! Our Free plan gives you 5 credits every month with no credit card required. You can generate up to 5 AI text ads to test the quality before upgrading.",
    },
    {
      q: 'What platforms do you support?',
      a: 'We currently support Google Ads, Facebook Ads, Instagram, LinkedIn Ads, TikTok, and YouTube. More platforms are being added regularly.',
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Absolutely. You can cancel your subscription anytime from your account settings. There are no cancellation fees and no long-term contracts.',
    },
    {
      q: 'Do you offer refunds?',
      a: "Yes, we offer a 14-day money-back guarantee on all paid plans. If you're not satisfied, contact us within 14 days of purchase for a full refund.",
    },
    {
      q: 'Is my data secure?',
      a: 'Yes. All data is encrypted in transit and at rest. We never sell or share your brand data with third parties. You own everything you create.',
    },
    {
      q: 'What languages are supported?',
      a: 'Starter plan supports 3 languages, Pro supports 10, and Agency supports 30+ languages including Urdu, Arabic, Spanish, French, German, Hindi, and more.',
    },
    {
      q: 'Can multiple team members use one account?',
      a: 'Team collaboration is available on Pro (2 members) and Agency (10 members) plans. Each member gets their own login and shared workspace.',
    },
  ];

  isOpen(i: number): boolean {
    return this.openIndex() === i;
  }

  toggle(i: number): void {
    this.openIndex.update((cur) => (cur === i ? null : i));
  }

  panelState(i: number): 'open' | 'closed' {
    return this.isOpen(i) ? 'open' : 'closed';
  }
}
