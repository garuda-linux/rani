import { ChangeDetectionStrategy, Component, ContentChild, inject, input, OnInit, TemplateRef } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { LoadingService } from './loading-indicator.service';
import { RouteConfigLoadEnd, RouteConfigLoadStart, Router } from '@angular/router';
import { ProgressSpinner } from 'primeng/progressspinner';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'loading-indicator',
  templateUrl: './loading-indicator.component.html',
  styleUrls: ['./loading-indicator.component.scss'],
  imports: [ProgressSpinner, AsyncPipe, NgTemplateOutlet],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingIndicatorComponent implements OnInit {
  detectRouteTransitions = input(false);

  @ContentChild('loading')
  customLoadingIndicator: TemplateRef<any> | null = null;

  private readonly router = inject(Router);
  protected readonly loadingService = inject(LoadingService);

  ngOnInit() {
    if (this.detectRouteTransitions()) {
      this.router.events
        .pipe(
          tap((event) => {
            if (event instanceof RouteConfigLoadStart) {
              this.loadingService.loadingOn();
            } else if (event instanceof RouteConfigLoadEnd) {
              this.loadingService.loadingOff();
            }
          }),
        )
        .subscribe();
    }
  }
}
