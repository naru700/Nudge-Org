import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as AuthActions from './auth.actions';
import { AuthService } from '../services/auth.service';
import { catchError, map, mergeMap, of } from 'rxjs';

@Injectable()
export class AuthEffects {
  registerUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.registerUser),
      mergeMap(action =>
        this.authService.register(action.name, action.email, action.password).pipe(
          map(() => AuthActions.registerUserSuccess()),
          catchError(err =>
            of(
              AuthActions.registerUserFailure({
                error: err.error?.detail || err.error?.message || 'Registration failed'
              })
            )
          )
        )
      )
    )
  );

  constructor(private actions$: Actions, private authService: AuthService) {}
}