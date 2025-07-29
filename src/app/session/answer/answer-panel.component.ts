import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SessionService } from '../../shared/services/session.service';
import { Store, select } from '@ngrx/store';
import { selectSessionId } from '../../home/store/home.selectors';
import { HomeSessionInputsState } from '../../home/store/home.reducer';

@Component({
  selector: 'app-answer-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule],
  templateUrl: './answer-panel.component.html',
  styleUrls: ['./answer-panel.component.scss']
})
export class AnswerPanelComponent implements AfterViewInit {
  userQuestion = '';
  aiAnswer = '';
  loading = false;
  sessionId = '';

  @ViewChild('questionInput') questionInput!: ElementRef;
  

  constructor(private sessionService: SessionService, private store: Store<{ home: HomeSessionInputsState }>) {
    this.store.pipe(select(selectSessionId)).subscribe(id => {
      this.sessionId = id ?? '';
    });

    this.sessionService.question$.subscribe((q) => {
    this.userQuestion = q;
    this.submitQuestion();
  });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.questionInput?.nativeElement?.focus();
    });
  }

  submitQuestion() {
  if (!this.userQuestion.trim()) return;
  this.loading = true;

    this.sessionService.generateAnswer(this.sessionId, this.userQuestion).subscribe({
      next: (res) => {
        this.aiAnswer = res.response;

      this.sessionService.addToHistory({
        question: this.userQuestion,
        answer: res.response
      });

      this.userQuestion = '';
      this.loading = false;
      this.questionInput.nativeElement.focus();
    },
    error: (err) => {
      console.error('API error:', err);
      this.aiAnswer = '⚠️ Failed to generate response.';
      this.loading = false;
    }
  });
}

}
