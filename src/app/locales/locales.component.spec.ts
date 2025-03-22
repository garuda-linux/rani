import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocalesComponent } from './locales.component';

describe('LocalesComponent', () => {
  let component: LocalesComponent;
  let fixture: ComponentFixture<LocalesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocalesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LocalesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
