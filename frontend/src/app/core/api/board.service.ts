import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { ApiResponse, Board, Column } from './api.models';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private http = inject(HttpClient);

  listByProject(projectId: string) {
    return this.http
      .get<ApiResponse<Board[]>>(`/api/v1/projects/${projectId}/boards`)
      .pipe(map((res) => res.data));
  }

  get(id: string) {
    return this.http
      .get<ApiResponse<Board>>(`/api/v1/boards/${id}`)
      .pipe(map((res) => res.data));
  }

  create(projectId: string, data: { name: string }) {
    return this.http
      .post<ApiResponse<Board>>(`/api/v1/projects/${projectId}/boards`, data)
      .pipe(map((res) => res.data));
  }

  update(id: string, data: { name?: string }) {
    return this.http
      .patch<ApiResponse<Board>>(`/api/v1/boards/${id}`, data)
      .pipe(map((res) => res.data));
  }

  delete(id: string) {
    return this.http.delete(`/api/v1/boards/${id}`);
  }

  // Columns

  listColumns(boardId: string) {
    return this.http
      .get<ApiResponse<Column[]>>(`/api/v1/boards/${boardId}/columns`)
      .pipe(map((res) => res.data));
  }

  createColumn(boardId: string, data: { name: string }) {
    return this.http
      .post<ApiResponse<Column>>(`/api/v1/boards/${boardId}/columns`, data)
      .pipe(map((res) => res.data));
  }

  updateColumn(id: string, data: { name?: string; position?: number }) {
    return this.http
      .patch<ApiResponse<Column>>(`/api/v1/columns/${id}`, data)
      .pipe(map((res) => res.data));
  }

  deleteColumn(id: string) {
    return this.http.delete(`/api/v1/columns/${id}`);
  }
}
