import { Component, ElementRef, ViewChild, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SessionService } from '../../shared/services/session.service';
import { Store, select } from '@ngrx/store';
import { selectSessionId } from '../../home/store/home.selectors';
import * as AuthActions from '../../auth/store/auth.actions';
import { Subject } from 'rxjs';
import { debounceTime, take, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-answer-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule],
  templateUrl: './answer-panel.component.html',
  styleUrls: ['./answer-panel.component.scss']
})
export class AnswerPanelComponent implements AfterViewInit, OnInit, OnDestroy {
  userQuestion = '';
  lastQuestion = '';
  aiAnswer = '';
  loading = false;
  cooldown = false;

  private readonly COOLDOWN_MS = 3000;
  private cooldownTimer: ReturnType<typeof setTimeout> | null = null;
  private destroy$ = new Subject<void>();

  @ViewChild('questionInput') questionInput!: ElementRef;

  constructor(private sessionService: SessionService, private store: Store) {}

  ngOnInit() {
    this.sessionService.question$
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(q => {
        this.userQuestion = q;
        this.submitQuestion();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.cooldownTimer) clearTimeout(this.cooldownTimer);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.questionInput?.nativeElement?.focus();
    });
  }

  private startCooldown(): void {
    this.cooldown = true;
    this.cooldownTimer = setTimeout(() => {
      this.cooldown = false;
      this.cooldownTimer = null;
    }, this.COOLDOWN_MS);
  }

  submitQuestion() {
    if (!this.userQuestion.trim() || this.loading || this.cooldown) return;
    this.loading = true;
    this.aiAnswer = '';

    // Snapshot so the closure captures the right value even if the input changes
    const questionSnapshot = this.userQuestion;

    this.store.pipe(select(selectSessionId), take(1)).subscribe(sessionId => {
      if (!sessionId) {
        this.aiAnswer = 'No active session. Please start a new meeting.';
        this.loading = false;
        return;
      }

      let fullAnswer = '';

      this.sessionService.generateAnswer(sessionId, questionSnapshot).subscribe({
        next: (token: string) => {
          if (this.loading) {
            // First token: stop showing spinner, reveal the answer block
            this.lastQuestion = questionSnapshot;
            this.loading = false;
          }
          this.aiAnswer += token;
          fullAnswer += token;
        },
        complete: () => {
          this.loading = false;
          if (fullAnswer) {
            this.sessionService.addToHistory({ question: questionSnapshot, answer: fullAnswer });
            this.store.dispatch(AuthActions.decrementCredits());
          }
          this.userQuestion = '';
          this.startCooldown();
          this.questionInput?.nativeElement?.focus();
        },
        error: (err: any) => {
          console.error('Generate API error:', err);
          this.loading = false;
          if (err.status === 401) {
            this.aiAnswer = 'Session expired. Please log in again.';
          } else if (err.status === 402) {
            this.aiAnswer = 'You are out of credits. Please top up to continue.';
          } else if (err.status === 429) {
            this.aiAnswer = 'Too many requests. Please wait a moment.';
          } else {
            this.aiAnswer = 'Failed to generate a response. Please try again.';
          }
          this.startCooldown();
        }
      });
    });
  }
}

