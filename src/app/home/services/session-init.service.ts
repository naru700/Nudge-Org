import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as HomeActions from '../store/home.actions';

@Injectable({ providedIn: 'root' })
export class SessionInitService {
  constructor(private store: Store) {}
   initSession() {
    const sessionId = localStorage.getItem('session_id');
    if (sessionId) {
      // Dispatch an action to set the session ID in the store
      this.store.dispatch(HomeActions.startSessionSuccess({ sessionId }));
    }
}
  }