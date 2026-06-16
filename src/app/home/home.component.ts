import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { Store, select } from '@ngrx/store';
import * as HomeActions from './store/home.actions';
import { selectSessionStarting, selectHomeError } from './store/home.selectors';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    InputTextareaModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  starting$ = this.store.pipe(select(selectSessionStarting));
  error$ = this.store.pipe(select(selectHomeError));

  selectedModel: string = 'gpt-4o';

  form = {
    position: '',
    prompt: '',
    customPrompt: '',
    llm: ''
  };

  models = [
    { label: 'GPT-4o', value: 'gpt-4o' },
    { label: 'GPT-4o mini', value: 'gpt-4o-mini' },
    { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
    { label: 'o4-mini', value: 'o4-mini' },
  ];

  constructor(private store: Store) {}

  startSession() {
    const position = this.form.position.trim();
    const prompt = this.form.prompt.trim();

    if (!position || !prompt || !this.selectedModel) {
      return;
    }

    this.store.dispatch(HomeActions.startSession({
      position,
      llm: this.selectedModel,
      prompt,
      customPrompt: this.form.customPrompt
    }));
  }
}
