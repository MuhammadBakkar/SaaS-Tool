import {
  AfterViewInit,
  Directive,
  ElementRef,
  inject,
  Input,
  OnDestroy,
  Renderer2,
} from '@angular/core';
import { AnimationService } from '../../core/services/animation.service';

@Directive({
  selector: '[appAnimateOnScroll]',
  standalone: true,
})
export class AnimateOnScrollDirective implements AfterViewInit, OnDestroy {
  @Input() appAnimateOnScrollDelay = 0;
  @Input() appAnimateOnScrollDuration = 600;
  @Input() appAnimateOnScrollDirection: 'up' | 'down' | 'left' | 'right' = 'up';

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly r = inject(Renderer2);
  private readonly anim = inject(AnimationService);
  private teardown?: () => void;
  private done = false;

  ngAfterViewInit(): void {
    const host = this.el.nativeElement;
    this.r.setAttribute(host, 'data-aos', '');
    this.r.setAttribute(host, 'data-aos-direction', this.appAnimateOnScrollDirection);
    host.style.setProperty('--aos-delay', `${this.appAnimateOnScrollDelay}ms`);
    host.style.setProperty('--aos-duration', `${this.appAnimateOnScrollDuration}ms`);

    this.teardown = this.anim.setupObserver(host, () => {
      if (this.done) return;
      this.done = true;
      this.r.addClass(host, 'aos-animated');
      this.teardown?.();
      this.teardown = undefined;
    });
  }

  ngOnDestroy(): void {
    this.teardown?.();
  }
}
