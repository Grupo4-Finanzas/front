import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { LoginRequest, RegisterRequest, User } from '../models/user.model';

interface AuthResponse {
  token: string;
  user: User;
}

interface ForgotPasswordResponse {
  message: string;
  resetToken?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly sessionKey = 'crediauto_session';
  private readonly tokenKey = 'crediauto_token';

  private readonly mockStorageKeys = [
    'crediauto_simulations',
    'crediauto_calculation_results',
    'crediauto_latest_calculation_id',
    'crediauto_profile_preferences'
  ];

  constructor(private readonly http: HttpClient) {}

  login(request: LoginRequest): Observable<User> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, request)
      .pipe(
        tap(response => this.persistSession(response)),
        map(response => response.user)
      );
  }

  register(request: RegisterRequest): Observable<User> {
    const { acceptedPrivacy: _acceptedPrivacy, ...payload } = request;

    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, payload)
      .pipe(
        tap(response => this.persistSession(response)),
        map(response => response.user)
      );
  }

  me(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(
      tap(user => localStorage.setItem(this.sessionKey, JSON.stringify(user)))
    );
  }

  updateProfile(payload: { fullName: string }): Observable<User> {
    return this.http.patch<User>(`${environment.apiUrl}/auth/me`, payload).pipe(
      tap(user => localStorage.setItem(this.sessionKey, JSON.stringify(user)))
    );
  }

  changePassword(payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/me/password`, payload);
  }

  forgotPassword(payload: { email: string }): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(
      `${environment.apiUrl}/auth/forgot-password`,
      payload
    );
  }

  resetPassword(payload: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/reset-password`, payload);
  }

  getCurrentUser(): User | null {
    const rawUser = localStorage.getItem(this.sessionKey);
    return rawUser ? (JSON.parse(rawUser) as User) : null;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser$(): Observable<User> {
    const currentUser = this.getCurrentUser();

    if (currentUser) {
      return of(currentUser);
    }

    if (this.getToken()) {
      return this.me();
    }

    return throwError(() => new Error('No hay sesion activa.'));
  }

  logout(): void {
    localStorage.removeItem(this.sessionKey);
    localStorage.removeItem(this.tokenKey);
    this.clearMockStorage();
  }

  private persistSession(response: AuthResponse): void {
    this.clearMockStorage();
    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.sessionKey, JSON.stringify(response.user));
  }

  private clearMockStorage(): void {
    for (const key of this.mockStorageKeys) {
      localStorage.removeItem(key);
    }
  }
}
