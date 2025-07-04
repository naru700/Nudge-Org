import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as HomeActions from './home.actions';
import { Router } from '@angular/router';
import { mergeMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class HomeEffects {
  startSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HomeActions.setHomeSessionInputs),
      mergeMap(action =>
        this.http.post<{ sessionId: string }>('http://127.0.0.1:8000/start-session', {
          prompt: action.prompt
        }).pipe(
          map(response => HomeActions.sessionStartedSuccess({ sessionId: response.sessionId })),
          catchError(error => of(HomeActions.sessionStartedFailure({ error: error.message || 'Session start failed' })))
        )
      )
    )
  );

  navigateToSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HomeActions.sessionStartedSuccess),
      map(action => {
        this.router.navigate(['/session', action.sessionId]);
      })
    ),
    { dispatch: false }
  );

  constructor(private actions$: Actions, private http: HttpClient, private router: Router) {}
}
