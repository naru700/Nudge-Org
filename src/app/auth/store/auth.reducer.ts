import { createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';

export interface AuthState {
  registering: boolean;
  registered: boolean;
  loggingIn: boolean;
  loggedIn: boolean;
  token: string | null;
  error: string | null;
}

export const initialState: AuthState = {
  registering: false,
  registered: false,
  loggingIn: false,
  loggedIn: false,
  token: null,
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
  })),
   on(AuthActions.loginUser, state => ({
    ...state,
    loggingIn: true,
    loggedIn: false,
    error: null
  })),
  on(AuthActions.loginUserSuccess, (state, { token }) => ({
    ...state,
    loggingIn: false,
    loggedIn: true,
    token,
    error: null
  })),
  on(AuthActions.loginUserFailure, (state, { error }) => ({
    ...state,
    loggingIn: false,
    loggedIn: false,
    error
  })),
  on(AuthActions.logoutUser, state => ({
  ...state,
  loggedIn: false,
  token: null,
  error: null
})),
);

