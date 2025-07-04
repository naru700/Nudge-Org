import { createAction, props } from '@ngrx/store';

export const setHomeSessionInputs = createAction(
  '[Home] Set Session Inputs',
  props<{
    position: string;
    llm: string;
    prompt: string;
    customPrompt: string;
  }>()
);

export const sessionStartedSuccess = createAction(
  '[Home] Session Started Success',
  props<{ sessionId: string }>()
);

export const sessionStartedFailure = createAction(
  '[Home] Session Started Failure',
  props<{ error: string }>()
);
