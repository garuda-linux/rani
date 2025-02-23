import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemdServicesComponent } from './systemd-services.component';

describe('SystemdServicesComponent', () => {
  let component: SystemdServicesComponent;
  let fixture: ComponentFixture<SystemdServicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SystemdServicesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SystemdServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
