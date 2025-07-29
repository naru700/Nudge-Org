import { createReducer, on } from '@ngrx/store';
import * as HomeActions from './home.actions';

export interface HomeSessionInputsState {
  position: string;
  llm: string;
  prompt: string;
  customPrompt: string;
  sessionId?: string; // Optional sessionId to store after session start
  error?: string; // Optional error message for failure cases
}

export const initialState: HomeSessionInputsState = {
  position: '',
  llm: '',
  prompt: '',
  customPrompt: ''
};

export const homeSessionInputsReducer = createReducer(
  initialState,
 on(HomeActions.startSessionSuccess, (state, { sessionId }) => ({
  ...state,
  sessionId,
  error: undefined
})),
);
