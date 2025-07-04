import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as HomeActions from './store/home.actions';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, DropdownModule, InputTextModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  constructor(private store: Store) {}

  form = {
    position: '',
    prompt: '',
    customPrompt: '',
    llm: ''
  };

  models = [
    { label: 'GPT-4', value: 'gpt-4' },
    { label: 'GPT-3.5', value: 'gpt-3.5' },
    { label: 'Claude 3', value: 'claude-3' },
    { label: 'Gemini Pro', value: 'gemini-pro' }
  ];

  startSession() {
    this.store.dispatch(HomeActions.setHomeSessionInputs({
      position: this.form.position,
      llm: this.form.llm,
      prompt: this.form.prompt,
      customPrompt: this.form.customPrompt
    }));
  }
}
