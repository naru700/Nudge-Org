import { Component, ElementRef, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SessionService } from '../../shared/services/session.service';
import { Store, select } from '@ngrx/store';
import { selectSessionId } from '../../home/store/home.selectors';
import { selectAuthToken } from '../../auth/store/auth.selectors';
import * as HomeActions from '../../home/store/home.actions';
import { combineLatest } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-answer-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule],
  templateUrl: './answer-panel.component.html',
  styleUrls: ['./answer-panel.component.scss']
})
export class AnswerPanelComponent implements AfterViewInit, OnInit {
  userQuestion = '';
  aiAnswer = '';
  loading = false;

  @ViewChild('questionInput') questionInput!: ElementRef;

  ngOnInit() {}

  constructor(private sessionService: SessionService, private store: Store) {
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
    combineLatest([
      this.store.pipe(select(selectSessionId), take(1)),
      this.store.pipe(select(selectAuthToken), take(1))
    ]).subscribe(
      ([sessionId, token]) => {
        if (!sessionId || !token) {
          this.aiAnswer = '⚠️ Session ID or token is missing.';
          this.loading = false;
          return;
        }
        this.sessionService.generateAnswer(sessionId, this.userQuestion, token).subscribe({
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
    );
  }
}