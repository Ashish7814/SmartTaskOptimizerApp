import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TaskBoardComponent } from './task-board.component';
import { TaskService } from '../../core/services/task.service';

describe('TaskBoardComponent', () => {
  let component: TaskBoardComponent;
  let fixture: ComponentFixture<TaskBoardComponent>;

  const taskServiceMock = {
    getTasks: () =>
      of({
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 100
      }),

    updateStatus: () => of(void 0)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskBoardComponent],
      providers: [
        {
          provide: TaskService,
          useValue: taskServiceMock
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskBoardComponent);
    component = fixture.componentInstance;

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
