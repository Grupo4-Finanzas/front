import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

const TOKEN_KEY = 'crediauto_token';

function isPublicAuthRequest(url: string): boolean {
  return url.includes('/auth/login')
    || url.includes('/auth/register')
    || url.includes('/auth/forgot-password')
    || url.includes('/auth/reset-password');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem(TOKEN_KEY);
  const publicAuthRequest = isPublicAuthRequest(req.url);

  if (!token || publicAuthRequest) {
    return next(req).pipe(
      catchError(error => throwError(() => error))
    );
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
  ).pipe(
    catchError(error => {
      if ((error.status === 401 || error.status === 403) && !publicAuthRequest) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('crediauto_session');
        router.navigateByUrl('/auth');
      }

      return throwError(() => error);
    })
  );
};
