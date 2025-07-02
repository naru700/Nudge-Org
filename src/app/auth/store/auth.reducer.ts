import { createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';

export interface AuthState {
  registering: boolean;
  registered: boolean;
  error: string | null;
}

export const initialState: AuthState = {
  registering: false,
  registered: false,
  error: null
};

export const authReducer = createReducer(
  initialState,
  on(AuthActions.registerUser, state => ({
    ...state,
    registering: true,
    registered: false,
    error: null
  })),
  on(AuthActions.registerUserSuccess, state => ({
    ...state,
    registering: false,
    registered: true,
    error: null
  })),
  on(AuthActions.registerUserFailure, (state, { error }) => ({
    ...state,
    registering: false,
    registered: false,
    error
  }))
);