import { createReducer, on } from '@ngrx/store';
import * as HomeActions from './home.actions';

export interface HomeSessionInputsState {
  position: string;
  llm: string;
  prompt: string;
  customPrompt: string;
  sessionId: string | null;
  starting: boolean;
  error: string | null;
}

export const initialState: HomeSessionInputsState = {
  position: '',
  llm: '',
  prompt: '',
  customPrompt: '',
  sessionId: null,
  starting: false,
  error: null
};

export const homeReducer = createReducer(
  initialState,
  on(HomeActions.startSession, (state, { position, llm, prompt, customPrompt }) => ({
    ...state,
    position,
    llm,
    prompt,
    customPrompt,
    starting: true,
    error: null
  })),
  on(HomeActions.startSessionSuccess, (state, { sessionId }) => ({
    ...state,
    sessionId,
    starting: false,
    error: null
  })),
  on(HomeActions.startSessionFailure, (state, { error }) => ({
    ...state,
    starting: false,
    error
  })),
  on(HomeActions.clearSession, () => ({
    ...initialState
  }))
);
