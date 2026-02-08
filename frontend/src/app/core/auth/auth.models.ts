export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

export interface AuthResponse {
  data: {
    user: User;
    access_token: string;
    refresh_token: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
}

export interface ErrorResponse {
  errors: ApiError[];
}
