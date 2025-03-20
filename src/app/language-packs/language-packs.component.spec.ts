import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguagePacksComponent } from './language-packs.component';

describe('LanguagePacksComponent', () => {
  let component: LanguagePacksComponent;
  let fixture: ComponentFixture<LanguagePacksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguagePacksComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguagePacksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
