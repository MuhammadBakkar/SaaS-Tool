import { Component } from '@angular/core';
import { AnimateOnScrollDirective } from '../../shared/directives/animate-on-scroll.directive';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [AnimateOnScrollDirective],
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.scss',
})
export class TestimonialsComponent {
  readonly items = [
    {
      name: 'Sarah Mitchell',
      role: 'Digital Marketing Manager',
      initials: 'SM',
      tone: 'teal',
      quote:
        'I used to spend 3 hours writing ad copy for each campaign. Now it takes 10 minutes. The quality is honestly better than what I was writing manually.',
    },
    {
      name: 'James Rodriguez',
      role: 'E-commerce Agency Owner',
      initials: 'JR',
      tone: 'purple',
      quote:
        'The bulk generator is a game-changer for our agency. We manage 40+ clients and this tool saves us at least 20 hours every week.',
    },
    {
      name: 'Aisha Khan',
      role: 'SaaS Founder',
      initials: 'AK',
      tone: 'blue',
      quote:
        'We cut our ad spend by 30% and doubled our CTR in the first month. The AI understands brand voice better than I expected.',
    },
  ] as const;
}
