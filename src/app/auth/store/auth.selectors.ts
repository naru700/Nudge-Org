import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectRegistering = createSelector(
  selectAuthState,
  (state) => state.registering
);

export const selectRegistered = createSelector(
  selectAuthState,
  (state) => state.registered
);

export const selectAuthError = createSelector(
  selectAuthState,
  (state) => state.error
);