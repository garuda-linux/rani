import { TestBed } from '@angular/core/testing';

import { OperationManagerService } from './operation-manager.service';

describe('OperationManagerService', () => {
  let service: OperationManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OperationManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
