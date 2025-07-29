import { createFeatureSelector, createSelector } from '@ngrx/store';
import { HomeSessionInputsState } from './home.reducer';

export const selectHomeSessionInputsState = createFeatureSelector<HomeSessionInputsState>('homeSessionInputs');

export const selectHomePosition = createSelector(
  selectHomeSessionInputsState,
  (state) => state.position
);

export const selectHomeLLM = createSelector(
  selectHomeSessionInputsState,
  (state) => state.llm
);

export const selectHomePrompt = createSelector(
  selectHomeSessionInputsState,
  (state) => state.prompt
);

export const selectHomeCustomPrompt = createSelector(
  selectHomeSessionInputsState,
  (state) => state.customPrompt
);

export const selectHomeState = (state: { home: HomeSessionInputsState }) => state.home;

export const selectSessionId = createSelector(
  selectHomeState,
  (state) => state.sessionId
);