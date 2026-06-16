import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as AuthActions from '../store/auth.actions';

@Injectable({ providedIn: 'root' })
export class AuthInitService {
  constructor(private store: Store) {}

  initAuth() {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      // Decode payload without a library — JWT is header.payload.signature, all base64url
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        // Already expired — clear storage silently so user lands on login with no confusion
        localStorage.removeItem('access_token');
        localStorage.removeItem('session_id');
        return;
      }
      this.store.dispatch(AuthActions.loginUserSuccess({ token }));
    } catch {
      // Malformed token — clear it
      localStorage.removeItem('access_token');
      localStorage.removeItem('session_id');
    }
  }
}