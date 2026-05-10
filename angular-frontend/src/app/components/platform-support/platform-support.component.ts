import { NgTemplateOutlet } from '@angular/common';
import { Component } from '@angular/core';
import { AnimateOnScrollDirective } from '../../shared/directives/animate-on-scroll.directive';

@Component({
  selector: 'app-platform-support',
  standalone: true,
  imports: [AnimateOnScrollDirective, NgTemplateOutlet],
  templateUrl: './platform-support.component.html',
  styleUrl: './platform-support.component.scss',
})
export class PlatformSupportComponent {}
