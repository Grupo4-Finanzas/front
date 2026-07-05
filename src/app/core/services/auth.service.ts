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
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, request)
      .pipe(
        tap(response => this.persistSession(response)),
        map(response => response.user)
      );
  }

  getCurrentUser(): User | null {
    const rawUser = localStorage.getItem(this.sessionKey);
    return rawUser ? (JSON.parse(rawUser) as User) : null;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  getCurrentUser$(): Observable<User> {
    const currentUser = this.getCurrentUser();

    if (currentUser) {
      return of(currentUser);
    }

    return throwError(() => new Error('No hay sesión activa.'));
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
