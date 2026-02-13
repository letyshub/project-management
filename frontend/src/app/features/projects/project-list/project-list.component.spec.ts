import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { ProjectListComponent } from './project-list.component';
import { ProjectService } from '../../../core/api/project.service';
import { Project } from '../../../core/api/api.models';

describe('ProjectListComponent', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;
  let mockProjectService: jasmine.SpyObj<ProjectService>;

  const mockProjects: Project[] = [
    {
      id: '1',
      name: 'Project 1',
      description: 'Description 1',
      owner_id: 'user-1',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ];

  beforeEach(async () => {
    mockProjectService = jasmine.createSpyObj('ProjectService', [
      'list',
      'delete',
    ]);
    mockProjectService.list.and.returnValue(of(mockProjects));
    mockProjectService.delete.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [ProjectListComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ProjectService, useValue: mockProjectService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load projects on init', () => {
    expect(mockProjectService.list).toHaveBeenCalled();
    expect(component.projects()).toEqual(mockProjects);
    expect(component.loading()).toBe(false);
  });

  it('should show empty state when no projects', () => {
    mockProjectService.list.and.returnValue(of([]));
    component.loadProjects();
    fixture.detectChanges();

    expect(component.projects().length).toBe(0);
  });
});
