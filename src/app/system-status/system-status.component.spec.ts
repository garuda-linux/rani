import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemStatusComponent } from './system-status.component';

describe('SystemStatusComponent', () => {
  let component: SystemStatusComponent;
  let fixture: ComponentFixture<SystemStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SystemStatusComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SystemStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
