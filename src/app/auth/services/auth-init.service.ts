import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as AuthActions from '../store/auth.actions';

@Injectable({ providedIn: 'root' })
export class AuthInitService {
  constructor(private store: Store) {}

  initAuth() {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.store.dispatch(AuthActions.loginUserSuccess({ token }));
    }
  }
}