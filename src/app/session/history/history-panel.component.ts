import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../shared/services/session.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-history-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history-panel.component.html',
  styleUrls: ['./history-panel.component.scss']
})
export class HistoryPanelComponent {
   @Output() questionSelected = new EventEmitter<string>();
  history$: Observable<{ question: string, answer: string }[]>;

  constructor(private sessionService: SessionService) {
    this.history$ = this.sessionService.history$;
  }
 
onSelect(q: string) {
  this.questionSelected.emit(q);
}

}
