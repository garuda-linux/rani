import { TestBed } from '@angular/core/testing';

import { GamingService } from './gaming.service';

describe('GamingService', () => {
  let service: GamingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GamingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
