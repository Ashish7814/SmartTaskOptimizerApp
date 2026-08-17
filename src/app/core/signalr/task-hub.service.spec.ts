import { TestBed } from '@angular/core/testing';

import { TaskHubService } from './task-hub.service';

describe('TaskHubService', () => {
  let service: TaskHubService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskHubService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
