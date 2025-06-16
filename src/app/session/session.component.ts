import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranscriptPanelComponent } from './transcript-panel/transcript-panel.component';
import { AnswerPanelComponent } from './answer-panel/answer-panel.component';
import { HistoryPanelComponent } from './history-panel/history-panel.component';

@Component({
  selector: 'app-session',
  standalone: true,
  imports: [CommonModule, TranscriptPanelComponent, AnswerPanelComponent, HistoryPanelComponent],
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss']
})
export class SessionComponent {}
