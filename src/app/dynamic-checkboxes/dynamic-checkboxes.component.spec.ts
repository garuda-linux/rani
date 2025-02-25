import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicCheckboxesComponent } from './dynamic-checkboxes.component';

describe('DynamicCheckboxesComponent', () => {
  let component: DynamicCheckboxesComponent;
  let fixture: ComponentFixture<DynamicCheckboxesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicCheckboxesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DynamicCheckboxesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
