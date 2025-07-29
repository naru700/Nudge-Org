import { createAction, props } from '@ngrx/store';

export const startSession = createAction(
  '[Home] Start Session',
  props<{ position: string; llm: string; prompt: string; customPrompt: string }>()
);

export const startSessionSuccess = createAction(
  '[Home] Session Started Success',
  props<{ sessionId: string }>()
);

export const startSessionFailure = createAction(
  '[Home] Session Started Failure',
  props<{ error: string }>()
);
