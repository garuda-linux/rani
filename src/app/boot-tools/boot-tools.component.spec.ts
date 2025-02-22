import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BootToolsComponent } from './boot-tools.component';

describe('BootToolsComponent', () => {
  let component: BootToolsComponent;
  let fixture: ComponentFixture<BootToolsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BootToolsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BootToolsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
