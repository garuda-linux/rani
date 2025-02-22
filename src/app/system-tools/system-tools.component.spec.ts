import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemToolsComponent } from './system-tools.component';

describe('SystemToolsComponent', () => {
  let component: SystemToolsComponent;
  let fixture: ComponentFixture<SystemToolsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SystemToolsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SystemToolsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
