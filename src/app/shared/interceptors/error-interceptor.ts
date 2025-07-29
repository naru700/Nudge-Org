import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMsg = '';
            if (error.error instanceof ErrorEvent) {
                // Client-side error
                errorMsg = `Error: ${error.error.message}`;
                console.error('Client-side error:', errorMsg);
            } else {
                // Server-side error
                errorMsg = `Error Code: ${error.status}, Message: ${error.message}`;
                console.error('Server-side error:', errorMsg, error);
            }
            return throwError(() => new Error(errorMsg));
        })
    );
};
