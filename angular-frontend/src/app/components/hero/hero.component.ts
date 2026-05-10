import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
import { interval } from 'rxjs';

export type AdVariation = {
  platform: string;
  headline: string;
  description: string;
  cta: string;
};

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
  animations: [
    trigger('cardContent', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(8px) scale(0.99)' }),
        animate('420ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
      ]),
    ]),
  ],
})
export class HeroComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly variations: AdVariation[] = [
    {
      platform: 'Google Ads',
      headline: 'Best AI Marketing Tool 2024',
      description: 'Generate 10x more leads with AI-powered ads. Start free today.',
      cta: 'Try Now',
    },
    {
      platform: 'Facebook Ads',
      headline: 'Stop Wasting Ad Budget',
      description: 'Our AI creates ads that convert. Used by 500+ agencies worldwide.',
      cta: 'Get Started',
    },
    {
      platform: 'Instagram',
      headline: 'AI Ads That Actually Work',
      description: 'From idea to high-performing ad in under 60 seconds.',
      cta: 'Start Free',
    },
  ];

  readonly activeIndex = signal(0);
  readonly cardState = signal('0');

  constructor() {
    interval(3000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const next = (this.activeIndex() + 1) % this.variations.length;
        this.activeIndex.set(next);
        this.cardState.set(String(next));
      });
  }

  current(): AdVariation {
    return this.variations[this.activeIndex()]!;
  }
}
