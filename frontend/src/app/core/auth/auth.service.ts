import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from './auth.models';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private currentUser = signal<User | null>(null);
  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUser());

  constructor() {
    this.loadUserFromToken();
  }

  get accessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  login(credentials: LoginRequest) {
    return this.http
      .post<AuthResponse>('/api/v1/auth/login', credentials)
      .pipe(tap((res) => this.handleAuthResponse(res)));
  }

  register(data: RegisterRequest) {
    return this.http.post<{ data: User }>('/api/v1/auth/register', data);
  }

  refresh() {
    return this.http
      .post<AuthResponse>('/api/v1/auth/refresh', {
        refresh_token: this.refreshToken,
      })
      .pipe(tap((res) => this.handleAuthResponse(res)));
  }

  logout() {
    const token = this.refreshToken;
    this.clearAuth();
    if (token) {
      this.http
        .post('/api/v1/auth/logout', { refresh_token: token })
        .subscribe();
    }
    this.router.navigate(['/auth/login']);
  }

  private handleAuthResponse(res: AuthResponse) {
    localStorage.setItem(ACCESS_TOKEN_KEY, res.data.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.data.refresh_token);
    this.currentUser.set(res.data.user);
  }

  private clearAuth() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.currentUser.set(null);
  }

  private loadUserFromToken() {
    const token = this.accessToken;
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 > Date.now()) {
        this.currentUser.set({
          id: payload.user_id,
          email: payload.email,
          name: '',
          role: payload.role,
          created_at: '',
          updated_at: '',
        });
      } else {
        this.clearAuth();
      }
    } catch {
      this.clearAuth();
    }
  }
}
