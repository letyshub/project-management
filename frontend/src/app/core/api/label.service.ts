import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { ApiResponse, Label } from './api.models';

@Injectable({ providedIn: 'root' })
export class LabelService {
  private http = inject(HttpClient);

  listByProject(projectId: string) {
    return this.http
      .get<ApiResponse<Label[]>>(`/api/v1/projects/${projectId}/labels`)
      .pipe(map((res) => res.data));
  }

  create(projectId: string, data: { name: string; color?: string }) {
    return this.http
      .post<ApiResponse<Label>>(`/api/v1/projects/${projectId}/labels`, data)
      .pipe(map((res) => res.data));
  }

  delete(labelId: string) {
    return this.http.delete(`/api/v1/labels/${labelId}`);
  }

  addToTask(taskId: string, labelId: string) {
    return this.http.post(`/api/v1/tasks/${taskId}/labels`, {
      label_id: labelId,
    });
  }

  removeFromTask(taskId: string, labelId: string) {
    return this.http.delete(`/api/v1/tasks/${taskId}/labels/${labelId}`);
  }

  listByTask(taskId: string) {
    return this.http
      .get<ApiResponse<Label[]>>(`/api/v1/tasks/${taskId}/labels`)
      .pipe(map((res) => res.data));
  }
}
