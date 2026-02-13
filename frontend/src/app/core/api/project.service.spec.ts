import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProjectService } from './project.service';
import { Project } from './api.models';

describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;

  const mockProjects: Project[] = [
    {
      id: '1',
      name: 'Project 1',
      description: 'Description 1',
      owner_id: 'user-1',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Project 2',
      description: 'Description 2',
      owner_id: 'user-1',
      created_at: '2026-01-02T00:00:00Z',
      updated_at: '2026-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list projects', () => {
    service.list().subscribe((projects) => {
      expect(projects.length).toBe(2);
      expect(projects[0].name).toBe('Project 1');
    });

    const req = httpMock.expectOne('/api/v1/projects');
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockProjects });
  });

  it('should get a project by id', () => {
    service.get('1').subscribe((project) => {
      expect(project.id).toBe('1');
      expect(project.name).toBe('Project 1');
    });

    const req = httpMock.expectOne('/api/v1/projects/1');
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockProjects[0] });
  });

  it('should create a project', () => {
    const newProject = { name: 'New Project', description: 'New Desc' };

    service.create(newProject).subscribe((project) => {
      expect(project.name).toBe('New Project');
    });

    const req = httpMock.expectOne('/api/v1/projects');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newProject);
    req.flush({
      data: { ...mockProjects[0], name: 'New Project', description: 'New Desc' },
    });
  });

  it('should update a project', () => {
    service.update('1', { name: 'Updated' }).subscribe((project) => {
      expect(project.name).toBe('Updated');
    });

    const req = httpMock.expectOne('/api/v1/projects/1');
    expect(req.request.method).toBe('PATCH');
    req.flush({ data: { ...mockProjects[0], name: 'Updated' } });
  });

  it('should delete a project', () => {
    service.delete('1').subscribe();

    const req = httpMock.expectOne('/api/v1/projects/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
