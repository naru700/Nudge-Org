import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranscriptPanelComponent } from './transcript/transcript-panel.component';
import { AnswerPanelComponent } from './answer/answer-panel.component';
import { HistoryPanelComponent } from './history/history-panel.component';
import { SessionService } from '../shared/services/session.service';

@Component({
  selector: 'app-session',
  standalone: true,
  imports: [CommonModule, TranscriptPanelComponent, AnswerPanelComponent, HistoryPanelComponent],
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss']
})
export class SessionComponent {
  private sessionService = inject(SessionService);

  onQuestionSelected(question: string): void {
    this.sessionService.question$.next(question);
  }
}
