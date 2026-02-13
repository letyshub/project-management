import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';
import { ApiResponse, Task } from './api.models';

export interface TaskFilter {
  priority?: string;
  assignee_id?: string;
  column_id?: string;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);

  listByBoard(boardId: string, filter?: TaskFilter) {
    let params = new HttpParams();
    if (filter?.priority) params = params.set('priority', filter.priority);
    if (filter?.assignee_id)
      params = params.set('assignee_id', filter.assignee_id);
    if (filter?.column_id)
      params = params.set('column_id', filter.column_id);

    return this.http
      .get<ApiResponse<Task[]>>(`/api/v1/boards/${boardId}/tasks`, { params })
      .pipe(map((res) => res.data));
  }

  get(id: string) {
    return this.http
      .get<ApiResponse<Task>>(`/api/v1/tasks/${id}`)
      .pipe(map((res) => res.data));
  }

  create(
    columnId: string,
    data: {
      title: string;
      description?: string;
      priority?: string;
      assignee_id?: string;
    },
  ) {
    return this.http
      .post<ApiResponse<Task>>(`/api/v1/columns/${columnId}/tasks`, data)
      .pipe(map((res) => res.data));
  }

  update(
    id: string,
    data: {
      title?: string;
      description?: string;
      priority?: string;
      assignee_id?: string | null;
    },
  ) {
    return this.http
      .patch<ApiResponse<Task>>(`/api/v1/tasks/${id}`, data)
      .pipe(map((res) => res.data));
  }

  move(id: string, data: { column_id: string; position: number }) {
    return this.http
      .put<ApiResponse<Task>>(`/api/v1/tasks/${id}/move`, data)
      .pipe(map((res) => res.data));
  }

  delete(id: string) {
    return this.http.delete(`/api/v1/tasks/${id}`);
  }

  exportCsv(boardId: string) {
    this.http
      .get(`/api/v1/boards/${boardId}/tasks/export`, {
        responseType: 'blob',
      })
      .subscribe((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tasks.csv';
        a.click();
        URL.revokeObjectURL(url);
      });
  }
}
