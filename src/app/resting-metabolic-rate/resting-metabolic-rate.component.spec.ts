import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestingMetabolicRateComponent } from './resting-metabolic-rate.component';

describe('RestingMetabolicRateComponent', () => {
  let component: RestingMetabolicRateComponent;
  let fixture: ComponentFixture<RestingMetabolicRateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RestingMetabolicRateComponent]
    });
    fixture = TestBed.createComponent(RestingMetabolicRateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
