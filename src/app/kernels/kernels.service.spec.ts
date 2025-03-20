import { TestBed } from '@angular/core/testing';

import { KernelsService } from './kernels.service';

describe('KernelsService', () => {
  let service: KernelsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KernelsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
