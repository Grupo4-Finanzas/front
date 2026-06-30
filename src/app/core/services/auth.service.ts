import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';

import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly usersUrl = 'assets/data/users.json';
  private readonly sessionKey = 'crediauto_session';

  constructor(private readonly http: HttpClient) {}

  startSession(): Observable<User> {
    return this.getDefaultUser().pipe(
      tap(user => {
        localStorage.setItem(this.sessionKey, JSON.stringify(user));
      })
    );
  }

  getCurrentUser(): User | null {
    const rawUser = localStorage.getItem(this.sessionKey);
    return rawUser ? JSON.parse(rawUser) as User : null;
  }

  getCurrentUser$(): Observable<User> {
    const currentUser = this.getCurrentUser();

    if (currentUser) {
      return of(currentUser);
    }

    return this.startSession();
  }

  logout(): void {
    localStorage.removeItem(this.sessionKey);
  }

  private getDefaultUser(): Observable<User> {
    return this.http.get<User[]>(this.usersUrl).pipe(
      map(users => {
        if (!users.length) {
          throw new Error('No hay usuarios.');
        }

        return users[0];
      })
    );
  }
}
