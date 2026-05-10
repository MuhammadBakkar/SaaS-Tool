import { AfterViewInit, Component, ElementRef, inject } from '@angular/core';
import { AnimationService } from '../../core/services/animation.service';

@Component({
  selector: 'app-stats-bar',
  standalone: true,
  templateUrl: './stats-bar.component.html',
  styleUrl: './stats-bar.component.scss',
})
export class StatsBarComponent implements AfterViewInit {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly anim = inject(AnimationService);

  private ran = false;

  ngAfterViewInit(): void {
    this.anim.setupObserver(this.host.nativeElement, () => {
      if (this.ran) return;
      this.ran = true;
      this.runCountUps();
    });
  }

  private runCountUps(): void {
    const root = this.host.nativeElement;
    const items: { sel: string; target: number; format: (n: number) => string }[] = [
      { sel: '[data-count="marketers"]', target: 500, format: (n) => `${n}+` },
      { sel: '[data-count="faster"]', target: 10, format: (n) => `${n}x` },
      { sel: '[data-count="langs"]', target: 30, format: (n) => `${n}+` },
      { sel: '[data-count="revenue"]', target: 2, format: (n) => `$${n}M+` },
    ];
    for (const m of items) {
      const node = root.querySelector(m.sel) as HTMLElement | null;
      if (!node) continue;
      this.anim.countUp(node, m.target, 1400, m.format);
    }
  }
}
