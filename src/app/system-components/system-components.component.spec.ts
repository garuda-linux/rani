import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemComponentsComponent } from './system-components.component';

describe('SystemComponentsComponent', () => {
  let component: SystemComponentsComponent;
  let fixture: ComponentFixture<SystemComponentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SystemComponentsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SystemComponentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
