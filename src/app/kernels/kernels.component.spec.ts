import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KernelsComponent } from './kernels.component';

describe('KernelsComponent', () => {
  let component: KernelsComponent;
  let fixture: ComponentFixture<KernelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KernelsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KernelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
