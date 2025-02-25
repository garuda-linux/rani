import { TestBed } from '@angular/core/testing';

import { PrivilegeManagerService } from './privilege-manager.service';

describe('PrivilegeManagerService', () => {
  let service: PrivilegeManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrivilegeManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
