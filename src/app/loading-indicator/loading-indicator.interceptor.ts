import { HttpContextToken, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { LoadingService } from './loading-indicator.service';
import { finalize, Observable } from 'rxjs';

export const SkipLoading = new HttpContextToken<boolean>(() => false);

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  loadingService = inject(LoadingService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Can be used to avoid showing the loading spinner for certain requests
    if (req.context.get(SkipLoading)) {
      return next.handle(req);
    }

    this.loadingService.loadingOn();
    return next.handle(req).pipe(finalize(() => this.loadingService.loadingOff()));
  }
}
