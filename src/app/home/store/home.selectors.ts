import { createFeatureSelector, createSelector } from '@ngrx/store';
import { HomeSessionInputsState } from './home.reducer';

export const selectHomeState = createFeatureSelector<HomeSessionInputsState>('home');

export const selectSessionId = createSelector(
  selectHomeState,
  (state) => state.sessionId
);
export const selectHomePosition = createSelector(
  selectHomeState,
  (state) => state.position
);

export const selectHomeLLM = createSelector(
  selectHomeState,
  (state) => state.llm
);

export const selectHomePrompt = createSelector(
  selectHomeState,
  (state) => state.prompt
);

export const selectHomeCustomPrompt = createSelector(
  selectHomeState,
  (state) => state.customPrompt
);

export const selectHomeError = createSelector(
  selectHomeState,
  (state) => state.error
);