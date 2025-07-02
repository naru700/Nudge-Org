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