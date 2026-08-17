import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { HttpInterceptorFn } from '@angular/common/http';

import { tokenInterceptor } from './token-interceptor';

describe('tokenInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) => 
    TestBed.runInInjectionContext(() => tokenInterceptor(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([])] });
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });
});
