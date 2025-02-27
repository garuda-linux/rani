import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivilegeManagerComponent } from './privilege-manager.component';

describe('PrivilegeManagerComponent', () => {
  let component: PrivilegeManagerComponent;
  let fixture: ComponentFixture<PrivilegeManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivilegeManagerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PrivilegeManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
