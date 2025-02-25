import { Injectable } from '@angular/core';
import { PrivilegeManager } from './privilege-manager';

@Injectable({
  providedIn: 'root',
})
export class PrivilegeManagerService {
  public manager = new PrivilegeManager();

  constructor() {}
}
