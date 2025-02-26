import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { trace } from '@tauri-apps/plugin-log';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$: Observable<boolean> = this.loadingSubject.asObservable();

  loadingOn(): void {
    void trace('Loading on');
    this.loadingSubject.next(true);
  }

  loadingOff(): void {
    void trace('Loading off');
    this.loadingSubject.next(false);
  }
}
