import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  ngOnInit(): void {
    const deleted = this.route.snapshot.queryParamMap.get('deleted');
    if (deleted === 'true') {
      this.toast.success('Your account has been deleted.');
      if (typeof history !== 'undefined') {
        history.replaceState({}, '', '/');
      }
    }
  }
}
