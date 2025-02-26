import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperationManagerComponent } from './operation-manager.component';

describe('OperationManagerComponent', () => {
  let component: OperationManagerComponent;
  let fixture: ComponentFixture<OperationManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperationManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OperationManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
