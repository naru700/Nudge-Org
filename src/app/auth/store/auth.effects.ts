import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as AuthActions from './auth.actions';
import * as HomeActions from '../../home/store/home.actions';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../../shared/services/session.service';
import { catchError, map, mergeMap, of, switchMap } from 'rxjs';

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

    loginUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginUser),
      mergeMap(action =>
        this.authService.login(action.email, action.password).pipe(
          map((res) => {
          localStorage.setItem('access_token', res.access_token);
          return AuthActions.loginUserSuccess({ token: res.access_token });
        }),
          catchError(err =>
            of(
              AuthActions.loginUserFailure({
                error: err.error?.detail || err.error?.message || 'Login failed'
              })
            )
          )
        )
      )
    )
  );

  loadCredits$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginUserSuccess),
      switchMap(() =>
        this.authService.getMe().pipe(
          map(me => AuthActions.setCredits({ credits: me.credits })),
          catchError((err) => {
            console.error('[loadCredits] /me failed:', err?.status, err?.error);
            return of();
          })
        )
      )
    )
  );

  logoutUser$ = createEffect(
  () =>
    this.actions$.pipe(
      ofType(AuthActions.logoutUser),
      map(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('session_id');
        this.sessionService.clearHistory();
        this.store.dispatch(HomeActions.clearSession());
      })
    ),
  { dispatch: false }
);

  
  
  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private sessionService: SessionService,
    private store: Store
  ) {}
}