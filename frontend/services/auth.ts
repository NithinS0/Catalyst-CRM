import { request } from './api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at?: string;
}

export interface RegisterResponse {
  status: string;
  message: string;
  user: AuthUser;
}

export interface LoginResponse {
  status: string;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
  user: AuthUser;
}

export const authService = {
  register: (name: string, email: string, password: string) =>
    request<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  login: (email: string, password: string) =>
    request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};
