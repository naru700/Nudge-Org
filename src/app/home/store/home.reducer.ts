import { createReducer, on } from '@ngrx/store';
import * as HomeActions from './home.actions';

export interface HomeSessionInputsState {
  position: string;
  llm: string;
  prompt: string;
  customPrompt: string;
}

export const initialState: HomeSessionInputsState = {
  position: '',
  llm: '',
  prompt: '',
  customPrompt: ''
};

export const homeSessionInputsReducer = createReducer(
  initialState,
  on(HomeActions.setHomeSessionInputs, (state, { position, llm, prompt, customPrompt }) => ({
    ...state,
    position,
    llm,
    prompt,
    customPrompt
  }))
);
