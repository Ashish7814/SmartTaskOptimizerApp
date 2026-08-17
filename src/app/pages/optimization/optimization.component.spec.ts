import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { OptimizationComponent } from './optimization.component';

describe('OptimizationComponent', () => {
  let component: OptimizationComponent;
  let fixture: ComponentFixture<OptimizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideRouter([])],
      imports: [OptimizationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OptimizationComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
