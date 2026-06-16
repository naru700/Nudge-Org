import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import * as AuthActions from '../../auth/store/auth.actions';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);
  const router = inject(Router);

  const token = localStorage.getItem('access_token');
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Skip auto-logout for background/non-critical requests tagged with X-Silent
        const isSilent = authReq.headers.has('X-Silent');
        if (!isSilent) {
          store.dispatch(AuthActions.logoutUser());
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};
