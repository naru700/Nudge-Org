import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export interface TranscriptionMessage {
  type: 'transcription' | 'error';
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
  private readonly wsUrl = 'ws://localhost:8000/speech/ws';
  private sessionId = this.generateSessionId();
  
  private connectionStatus = new BehaviorSubject<boolean>(false);
  private transcriptionSubject = new Subject<TranscriptionMessage>();
  
  public connectionStatus$ = this.connectionStatus.asObservable();
  public transcription$ = this.transcriptionSubject.asObservable();

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);
        
        this.ws.onopen = () => {
          this.connectionStatus.next(true);
          console.log('WebSocket connected');
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          console.log('WebSocket message received:', event.data);
          try {
            // Try parsing as JSON first
            const data: TranscriptionMessage = JSON.parse(event.data);
            this.transcriptionSubject.next(data);
          } catch (error) {
            // If not JSON, treat as plain text transcription (like reference HTML)
            console.log('Received plain text transcription:', event.data);
            this.transcriptionSubject.next({
              type: 'transcription',
              text: event.data,
              timestamp: new Date().toISOString()
            });
          }
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
        
        this.ws.onclose = () => {
          this.connectionStatus.next(false);
          console.log('WebSocket disconnected');
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  sendAudio(audioData: ArrayBuffer | string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Send binary data directly (like the reference HTML)
      if (audioData instanceof ArrayBuffer) {
        console.log(`Sending audio data: ${audioData.byteLength} bytes`);
        this.ws.send(audioData);
      } else {
        // If it's base64 string, convert to ArrayBuffer
        const binaryString = atob(audioData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        console.log(`Sending audio data: ${bytes.buffer.byteLength} bytes`);
        this.ws.send(bytes.buffer);
      }
    } else {
      console.warn('WebSocket is not open. ReadyState:', this.ws?.readyState);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
