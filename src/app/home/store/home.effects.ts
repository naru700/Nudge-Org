import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store, select } from '@ngrx/store';
import { Router } from '@angular/router';
import { switchMap, withLatestFrom, map, catchError, of } from 'rxjs';
import * as HomeActions from './home.actions';
import { selectAuthToken } from '../../auth/store/auth.selectors';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable()
export class HomeEffects {
  constructor(
    private actions$: Actions,
    private store: Store,
    private http: HttpClient,
    private router: Router
  ) {}

  startSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HomeActions.startSession),
      withLatestFrom(this.store.pipe(select(selectAuthToken))),
      switchMap(([action, token]) =>
        this.http.post<{ sessionId: string }>(`${environment.apiBaseUrl}/start-session`, {
          position: action.position,
          llm: action.llm,
          prompt: action.prompt,
          customPrompt: action.customPrompt
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).pipe(
          map(res => HomeActions.startSessionSuccess({ sessionId: res.sessionId })),
          catchError(err =>
            of(HomeActions.startSessionFailure({ error: err.error?.detail || 'Session start failed' }))
          )
        )
      )
    )
  );
  navigateToSession$ = createEffect(
  () =>
    this.actions$.pipe(
      ofType(HomeActions.startSessionSuccess),
      map(action => {
        // If you use route params:
        // this.router.navigate(['/session', action.sessionId]);
        // If you use state only:
        this.router.navigate(['/session']);
      })
    ),
  { dispatch: false }
);
}