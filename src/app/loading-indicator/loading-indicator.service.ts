import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Logger } from '../logging/logging';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();
  private readonly logger = Logger.getInstance();

  loadingOn(): void {
    this.logger.trace('Loading on');
    this.loadingSubject.next(true);
  }

  loadingOff(): void {
    this.logger.trace('Loading off');
    this.loadingSubject.next(false);
  }
}
