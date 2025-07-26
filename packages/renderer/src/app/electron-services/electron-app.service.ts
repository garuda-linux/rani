import { Injectable } from '@angular/core';
import { windowRelaunch } from './electron-api-utils';

@Injectable({
  providedIn: 'root',
})
export class ElectronAppService {
  async relaunch(): Promise<void> {
    windowRelaunch();
  }
}
