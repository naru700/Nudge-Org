import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SessionService } from '../../shared/services/session.service';

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

  @ViewChild('questionInput') questionInput!: ElementRef;

  constructor(private sessionService: SessionService) {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.questionInput?.nativeElement?.focus();
    });
  }

  submitQuestion() {
  if (!this.userQuestion.trim()) return;
  this.loading = true;

  const sessionId = '0401e770-561a-4c60-9a19-918c19de92f0'; 

  this.sessionService.generateAnswer(sessionId, this.userQuestion).subscribe({
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
