import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewChild,
  AfterViewChecked,
  CUSTOM_ELEMENTS_SCHEMA,
  inject
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { Store, select } from '@ngrx/store';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';
import { SessionService } from '../../shared/services/session.service';
import { WebsocketTranscriptionService } from '../../services/websocket-transcription.service';
import { AudioCaptureService } from '../../services/audio-capture.service';
import { selectSessionId } from '../../home/store/home.selectors';

@Component({
  selector: 'app-transcript-panel',
  standalone: true,
  imports: [CommonModule, ButtonModule, ButtonGroupModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './transcript-panel.component.html',
  styleUrls: ['./transcript-panel.component.scss'],
})
export class TranscriptPanelComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('screenVideo') screenVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('transcriptBox') transcriptBox!: ElementRef<HTMLDivElement>;

  private destroy$ = new Subject<void>();
  private cd = inject(ChangeDetectorRef);
  private store = inject(Store);
  private sessionService = inject(SessionService);
  private wsService = inject(WebsocketTranscriptionService);
  private audioCapture = inject(AudioCaptureService);
  private shouldScrollToBottom = false;

  // Stable reference so addEventListener/removeEventListener work correctly
  private readonly boundHandleKeyPress = (event: KeyboardEvent) => this.handleKeyPress(event);

  micActive: boolean = false;
  transcriptLines: string[] = [];

  wsConnected: boolean = false;
  wsTranscriptLines: string[] = [];
  wsConnectionError: string = '';
  screenShareActive: boolean = false;
  currentTranscript: string = '';

  ngOnInit(): void {
    this.wsService.connectionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe((connected: boolean) => {
        this.wsConnected = connected;
        this.cd.detectChanges();
      });

    this.wsService.transcription$
      .pipe(takeUntil(this.destroy$))
      .subscribe((message: any) => {
        if (message.type === 'transcription' && message.text) {
          const text = message.text.trim();

          if (text.length < 3 || this.isGarbageText(text)) {
            return;
          }

          const formattedText = this.formatTranscription(text);
          this.wsTranscriptLines.push(formattedText);
          this.transcriptLines.push(formattedText);
          this.currentTranscript = formattedText;

          this.shouldScrollToBottom = true;
          this.cd.detectChanges();
        } else if (message.type === 'error') {
          this.wsConnectionError = message.message || 'Transcription error';
          this.cd.detectChanges();
        }
      });

    this.audioCapture.recordingStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cd.detectChanges());

    document.addEventListener('keydown', this.boundHandleKeyPress);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnectWebSocket();
    this.stopMicrophone();
    this.stopScreenShareWithAudio();
    document.removeEventListener('keydown', this.boundHandleKeyPress);
  }

  private scrollToBottom(): void {
    try {
      if (this.transcriptBox) {
        const el = this.transcriptBox.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  private handleKeyPress(event: KeyboardEvent): void {
    // Don't intercept Enter when the user is typing in an input or textarea
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submitToInsights();
    }
  }

  submitToInsights(): void {
    const selectedText = window.getSelection()?.toString().trim();

    if (selectedText) {
      this.sessionService.question$.next(selectedText);
      window.getSelection()?.removeAllRanges();
      this.currentTranscript = '';
    } else if (this.currentTranscript.trim()) {
      this.sessionService.question$.next(this.currentTranscript);
      this.currentTranscript = '';
    }
  }

  async toggleMicrophone(): Promise<void> {
    if (this.micActive) {
      this.stopMicrophone();
    } else {
      await this.startMicrophone();
    }
  }

  async startMicrophone(): Promise<void> {
    try {
      if (!this.wsConnected) {
        await this.connectWebSocket();
      }

      await this.audioCapture.startRecording((audioData: ArrayBuffer) => {
        if (this.wsConnected) {
          this.wsService.sendAudio(audioData);
        }
      });

      this.micActive = true;
      this.wsConnectionError = '';
    } catch (error) {
      this.wsConnectionError = 'Failed to start microphone. Check permissions.';
      console.error('Microphone error:', error);
    }
  }

  stopMicrophone(): void {
    this.audioCapture.stopRecording();
    this.micActive = false;
  }

  async toggleScreenShareWithAudio(): Promise<void> {
    if (this.screenShareActive) {
      this.stopScreenShareWithAudio();
    } else {
      await this.startScreenShareWithAudio();
    }
  }

  async startScreenShareWithAudio(): Promise<void> {
    try {
      if (!this.wsConnected) {
        await this.connectWebSocket();
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 16000
        }
      });

      const videoElement = this.screenVideo.nativeElement;
      videoElement.srcObject = stream;
      videoElement.muted = true;
      videoElement.play();

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        this.wsConnectionError = 'No audio track! Check "Share audio" checkbox when sharing.';
        this.cd.detectChanges();
      } else {
        const audioOnlyStream = new MediaStream(audioTracks);
        const mediaRecorder = new MediaRecorder(audioOnlyStream, {
          mimeType: 'audio/webm;codecs=opus'
        });

        let audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          if (audioChunks.length > 0 && this.screenShareActive) {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const arrayBuffer = await audioBlob.arrayBuffer();

            if (arrayBuffer.byteLength > 1000 && this.wsConnected) {
              this.wsService.sendAudio(arrayBuffer);
            }
            audioChunks = [];
          }
        };

        // 3-second chunks for VAD sentence-boundary detection
        mediaRecorder.start();
        const chunkInterval = setInterval(() => {
          if (mediaRecorder.state === 'recording' && this.screenShareActive) {
            mediaRecorder.stop();
            mediaRecorder.start();
          } else {
            clearInterval(chunkInterval);
          }
        }, 3000);

        (this as any).screenMediaRecorder = mediaRecorder;
        (this as any).screenChunkInterval = chunkInterval;

        audioTracks.forEach(track => {
          track.onended = () => this.stopScreenShareWithAudio();
        });
      }

      this.screenShareActive = true;
      this.wsConnectionError = '';

      stream.getVideoTracks()[0].addEventListener('ended', () => {
        this.stopScreenShareWithAudio();
      });

    } catch (error: any) {
      console.error('Screen share with audio error:', error);
      if (error.name === 'NotAllowedError') {
        this.wsConnectionError = 'Permission denied. Click "Share" when dialog appears.';
      } else {
        this.wsConnectionError = 'Failed to capture screen/audio.';
      }
      this.cd.detectChanges();
    }
  }

  stopScreenShareWithAudio(): void {
    this.screenShareActive = false;

    if ((this as any).screenChunkInterval) {
      clearInterval((this as any).screenChunkInterval);
      (this as any).screenChunkInterval = null;
    }

    if ((this as any).screenMediaRecorder) {
      const mr = (this as any).screenMediaRecorder;
      if (mr.state !== 'inactive') {
        mr.stop();
      }
      (this as any).screenMediaRecorder = null;
    }

    const videoElement = this.screenVideo.nativeElement;
    if (videoElement.srcObject) {
      (videoElement.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoElement.srcObject = null;
    }

    this.cd.detectChanges();
  }

  async connectWebSocket(): Promise<void> {
    const sessionId = await firstValueFrom(this.store.pipe(select(selectSessionId)));
    if (!sessionId) {
      this.wsConnectionError = 'No active session. Please start a session first.';
      throw new Error('No session ID available');
    }
    try {
      await this.wsService.connect(sessionId);
      this.wsConnectionError = '';
    } catch (error) {
      this.wsConnectionError = 'Failed to connect to transcription service';
      console.error('WebSocket connection error:', error);
      throw error;
    }
  }

  disconnectWebSocket(): void {
    this.wsService.disconnect();
  }

  private isGarbageText(text: string): boolean {
    const garbagePatterns = [
      /^(you|um|uh|ah|mm|hmm)$/i,
      /^\s*$/,
      /^[\.\,\!\?]+$/,
      /thank you for watching/i,
      /subscribe/i,
      /^\[.*\]$/
    ];
    return garbagePatterns.some(pattern => pattern.test(text));
  }

  private formatTranscription(text: string): string {
    if (!text) return text;
    let formatted = text.charAt(0).toUpperCase() + text.slice(1);
    if (!/[.!?]$/.test(formatted)) {
      formatted += /^(what|where|when|who|why|how|is|are|can|could|would|should|do|does|did)/i.test(formatted)
        ? '?'
        : '.';
    }
    return formatted;
  }
}
