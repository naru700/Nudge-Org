import { createAction, props } from '@ngrx/store';

export const registerUser = createAction(
  '[Auth] Register User',
  props<{ name: string; email: string; password: string }>()
);

export const registerUserSuccess = createAction(
  '[Auth] Register User Success'
);

export const registerUserFailure = createAction(
  '[Auth] Register User Failure',
  props<{ error: string }>()
);

export const loginUser = createAction(
  '[Auth] Login User',
  props<{ email: string; password: string }>()
);

export const loginUserSuccess = createAction(
  '[Auth] Login User Success',
  props<{ token: string }>() // or user info as needed
);

export const loginUserFailure = createAction(
  '[Auth] Login User Failure',
  props<{ error: string }>()
);

export const logoutUser = createAction('[Auth] Logout User');