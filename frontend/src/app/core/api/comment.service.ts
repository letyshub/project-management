import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { ApiResponse, Comment } from './api.models';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private http = inject(HttpClient);

  listByTask(taskId: string) {
    return this.http
      .get<ApiResponse<Comment[]>>(`/api/v1/tasks/${taskId}/comments`)
      .pipe(map((res) => res.data));
  }

  create(taskId: string, content: string) {
    return this.http
      .post<ApiResponse<Comment>>(`/api/v1/tasks/${taskId}/comments`, {
        content,
      })
      .pipe(map((res) => res.data));
  }

  update(commentId: string, content: string) {
    return this.http
      .patch<ApiResponse<Comment>>(`/api/v1/comments/${commentId}`, {
        content,
      })
      .pipe(map((res) => res.data));
  }

  delete(commentId: string) {
    return this.http.delete(`/api/v1/comments/${commentId}`);
  }
}
