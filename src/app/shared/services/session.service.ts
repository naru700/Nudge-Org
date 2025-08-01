import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private historySubject = new BehaviorSubject<{ question: string, answer: string }[]>([]);
  history$ = this.historySubject.asObservable();

  question$ = new Subject<string>();

  constructor(private http: HttpClient) {}

  generateAnswer(sessionId: string, question: string): Observable<{
    response: string;
}> {
   const token = localStorage.getItem('access_token') ?? '';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  return this.http.post<{ response: string }>(
    'http://127.0.0.1:8000/generate',
    {
      session_id: sessionId,
      user_message: question
    },
    { headers }
  );
}


 addToHistory(qna: { question: string, answer: string }) {
  const current = [...this.historySubject.value, qna];
  localStorage.setItem('nudge-history', JSON.stringify(current));
  this.historySubject.next(current);
}

loadFromStorage() {
  const saved = localStorage.getItem('nudge-history');
  if (saved) {
    this.historySubject.next(JSON.parse(saved));
  }
}

}
