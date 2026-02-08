import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { ApiResponse, Project } from './api.models';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private http = inject(HttpClient);

  list() {
    return this.http
      .get<ApiResponse<Project[]>>('/api/v1/projects')
      .pipe(map((res) => res.data));
  }

  get(id: string) {
    return this.http
      .get<ApiResponse<Project>>(`/api/v1/projects/${id}`)
      .pipe(map((res) => res.data));
  }

  create(data: { name: string; description: string }) {
    return this.http
      .post<ApiResponse<Project>>('/api/v1/projects', data)
      .pipe(map((res) => res.data));
  }

  update(id: string, data: { name?: string; description?: string }) {
    return this.http
      .patch<ApiResponse<Project>>(`/api/v1/projects/${id}`, data)
      .pipe(map((res) => res.data));
  }

  delete(id: string) {
    return this.http.delete(`/api/v1/projects/${id}`);
  }
}
