import { Injectable } from '@angular/core';
import { OperationManager } from './operation-manager';

@Injectable({
  providedIn: 'root',
})
export class OperationManagerService {
  public manager = new OperationManager();

  constructor() {}
}
