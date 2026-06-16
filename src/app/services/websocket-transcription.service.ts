import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TranscriptionMessage {
  type: 'transcription' | 'error' | 'ack';
  text?: string;
  message?: string;
  timestamp: string;
  session_id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketTranscriptionService {
  private ws: WebSocket | null = null;
  private readonly wsUrl = `${environment.wsBaseUrl}/speech/ws`;
  private sessionId: string | null = null;

  private connectionStatus = new BehaviorSubject<boolean>(false);
  private transcriptionSubject = new Subject<TranscriptionMessage>();

  public connectionStatus$ = this.connectionStatus.asObservable();
  public transcription$ = this.transcriptionSubject.asObservable();

  constructor(private ngZone: NgZone) {}

  connect(sessionId: string): Promise<void> {
    this.sessionId = sessionId;

    const token = localStorage.getItem('access_token');
    if (!token) {
      return Promise.reject(new Error('No auth token — please log in'));
    }

    const url = `${this.wsUrl}?token=${encodeURIComponent(token)}`;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          this.ngZone.run(() => {
            this.connectionStatus.next(true);
            resolve();
          });
        };

        this.ws.onmessage = (event) => {
          this.ngZone.run(() => {
            try {
              const data: TranscriptionMessage = JSON.parse(event.data);
              if (data.type !== 'ack') {
                this.transcriptionSubject.next(data);
              }
            } catch {
              this.transcriptionSubject.next({
                type: 'transcription',
                text: event.data,
                timestamp: new Date().toISOString()
              });
            }
          });
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          this.ngZone.run(() => {
            this.connectionStatus.next(false);
            if (event.code === 4001) {
              this.transcriptionSubject.next({
                type: 'error',
                message: 'Session expired. Please log in again.',
                timestamp: new Date().toISOString()
              });
            }
          });
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  sendAudio(audioData: ArrayBuffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WS not open, readyState:', this.ws?.readyState);
      return;
    }
    const sessionId = this.sessionId;
    if (!sessionId) {
      console.warn('No sessionId on WS service');
      return;
    }

    try {
      // Chunked encoding avoids call-stack overflow on large buffers
      const bytes = new Uint8Array(audioData);
      let binary = '';
      const CHUNK = 0x8000; // 32 KB slices
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + CHUNK, bytes.length)));
      }
      const base64 = btoa(binary);

      this.ws.send(JSON.stringify({
        audio: base64,
        timestamp: new Date().toISOString(),
        session_id: sessionId
      }));
      console.log(`[WS] sent ${audioData.byteLength} bytes → ${base64.length} b64 chars (session: ${sessionId})`);
    } catch (err) {
      console.error('[WS] audio encode/send failed:', err);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.sessionId = null;
  }
}
