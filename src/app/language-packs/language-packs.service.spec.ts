import { TestBed } from '@angular/core/testing';

import { LanguagePacksService } from './language-packs.service';

describe('LanguagePacksService', () => {
  let service: LanguagePacksService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LanguagePacksService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
