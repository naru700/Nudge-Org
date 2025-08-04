import { createReducer, on } from '@ngrx/store';
import * as HomeActions from './home.actions';

export interface HomeSessionInputsState {
  position: string;
  llm: string;
  prompt: string;
  customPrompt: string;
  sessionId: string | null; // Optional, will be set on success
  error: string | null; // Optional, will be set on failure
}

export const initialState: HomeSessionInputsState = {
  position: '',
  llm: '',
  prompt: '',
  customPrompt: '',
  sessionId: null, // Initialize sessionId as null
  error: null // Initialize error as null
  // sessionId and error are not initialized here as they will be set later
};

export const homeReducer = createReducer(
  initialState,
  on(HomeActions.startSessionSuccess, (state, { sessionId }) => ({
    ...state,
    sessionId
  })),
  on(HomeActions.startSessionFailure, (state, { error }) => ({
    ...state,
    error
  })));
