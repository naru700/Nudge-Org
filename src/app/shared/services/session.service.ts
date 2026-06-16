import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private historySubject = new BehaviorSubject<{ question: string, answer: string }[]>([]);
  history$ = this.historySubject.asObservable();

  question$ = new Subject<string>();

  constructor(private http: HttpClient, private ngZone: NgZone) {
    this.loadFromStorage();
  }

  /**
   * Streams tokens from /generate via SSE.
   * Emits one string per token; completes when [DONE] is received.
   * Errors carry { status, error } matching HttpErrorResponse shape.
   */
  generateAnswer(sessionId: string, question: string): Observable<string> {
    return new Observable<string>(observer => {
      const controller = new AbortController();

      fetch(`${environment.apiBaseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token') ?? ''}`
        },
        body: JSON.stringify({ session_id: sessionId, user_message: question }),
        signal: controller.signal
      })
      .then(async response => {
        if (!response.ok) {
          let body: any = {};
          try { body = await response.json(); } catch {}
          this.ngZone.run(() => observer.error({ status: response.status, error: body }));
          return;
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const payload = line.slice(6).trim();
              if (payload === '[DONE]') {
                this.ngZone.run(() => observer.complete());
                return;
              }
              try {
                const parsed = JSON.parse(payload);
                if (parsed.token) {
                  this.ngZone.run(() => observer.next(parsed.token));
                } else if (parsed.error) {
                  this.ngZone.run(() =>
                    observer.error({ status: 500, error: { detail: parsed.error } })
                  );
                  return;
                }
              } catch {}
            }
          }
        } finally {
          reader.cancel();
        }

        this.ngZone.run(() => observer.complete());
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          this.ngZone.run(() => observer.error({ status: 0, error: err }));
        }
      });

      return () => controller.abort();
    });
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

clearHistory() {
  localStorage.removeItem('nudge-history');
  this.historySubject.next([]);
}

}
