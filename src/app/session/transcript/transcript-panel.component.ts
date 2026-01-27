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
import { SessionService } from '../../shared/services/session.service';
import { WebsocketTranscriptionService } from '../../services/websocket-transcription.service';
import { AudioCaptureService } from '../../services/audio-capture.service';
import { Subject, takeUntil } from 'rxjs';

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
  private sessionService = inject(SessionService);
  private wsService = inject(WebsocketTranscriptionService);
  private audioCapture = inject(AudioCaptureService);
  private shouldScrollToBottom = false;
  
  micStream: MediaStream | null = null;
  micActive: boolean = false;
  transcriptLines: string[] = [];
  
  // WebSocket transcription properties
  wsConnected: boolean = false;
  wsTranscriptLines: string[] = [];
  wsConnectionError: string = '';
  screenShareActive: boolean = false;
  currentTranscript: string = '';
  
  ngOnInit(): void {
    // Subscribe to WebSocket connection status
    this.wsService.connectionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe((connected: boolean) => {
        this.wsConnected = connected;
        this.cd.detectChanges();
      });

    // Subscribe to WebSocket transcription messages
    this.wsService.transcription$
      .pipe(takeUntil(this.destroy$))
      .subscribe((message: any) => {
        console.log('Transcription message received in component:', message);
        if (message.type === 'transcription' && message.text) {
          const text = message.text.trim();
          
          // Skip very short or meaningless transcriptions
          if (text.length < 3 || this.isGarbageText(text)) {
            console.log('Skipping low-quality transcription:', text);
            return;
          }
          
          // Capitalize first letter and add proper punctuation if missing
          const formattedText = this.formatTranscription(text);
          
          this.wsTranscriptLines.push(formattedText);
          this.transcriptLines.push(formattedText); // Show in chronological order
          this.currentTranscript = formattedText; // Store for manual submission
          
          // Automatically trigger insights generation
          // COMMENTED OUT: User wants manual submission via Enter key or Send button
          // this.sessionService.question$.next(formattedText);
          // console.log('Triggering insights for:', formattedText);
          
          this.shouldScrollToBottom = true;
          this.cd.detectChanges();
        } else if (message.type === 'error') {
          this.wsConnectionError = message.message || 'Transcription error';
          console.error('WebSocket transcription error:', message.message);
          this.cd.detectChanges();
        }
      });

    // Subscribe to recording status
    this.audioCapture.recordingStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe((recording: boolean) => {
        this.cd.detectChanges();
      });

    // Add Enter key listener for manual submission
    document.addEventListener('keydown', this.handleKeyPress.bind(this));
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.transcriptBox) {
        const element = this.transcriptBox.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  private handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent any default behavior
      event.stopPropagation(); // Stop event from bubbling
      this.submitToInsights();
    }
  }

  submitToInsights(): void {
    // First check if user has selected text
    const selectedText = window.getSelection()?.toString().trim();
    
    if (selectedText) {
      // User selected specific text - send that
      this.sessionService.question$.next(selectedText);
      console.log('Manually triggering insights for selected text:', selectedText);
      this.currentTranscript = ''; // Clear after submission
      window.getSelection()?.removeAllRanges(); // Clear selection
    } else if (this.currentTranscript.trim()) {
      // No selection - send latest transcription
      this.sessionService.question$.next(this.currentTranscript);
      console.log('Manually triggering insights for latest transcription:', this.currentTranscript);
      this.currentTranscript = ''; // Clear after submission
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnectWebSocket();
    this.stopMicrophone();
    this.stopScreenShareWithAudio();
    document.removeEventListener('keydown', this.handleKeyPress.bind(this));
  }

  startScreenShare(): void {
    navigator.mediaDevices
      .getDisplayMedia({ video: true })
      .then((stream) => {
        const videoElement = this.screenVideo.nativeElement;
        videoElement.srcObject = stream;
        videoElement.play();

        stream.getVideoTracks()[0].addEventListener('ended', () => {
          videoElement.srcObject = null;
        });
      })
      .catch((err) => {
        console.error('Screen share error:', err);
      });
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
      // Connect to WebSocket if not already connected
      if (!this.wsConnected) {
        await this.connectWebSocket();
      }

      // Request display media with video and audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 16000
        }
      });

      // Show video in the video element
      const videoElement = this.screenVideo.nativeElement;
      videoElement.srcObject = stream;
      videoElement.muted = true; // Mute to prevent echo/dual audio
      videoElement.play();

      // Check if audio track exists
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        this.wsConnectionError = 'No audio track! Check "Share audio" checkbox when sharing.';
        this.cd.detectChanges();
      } else {
        console.log('✅ Audio tracks captured:', audioTracks.length);
        
        // Create a new stream with only audio for recording
        const audioOnlyStream = new MediaStream();
        audioTracks.forEach(track => {
          audioOnlyStream.addTrack(track);
          console.log('Audio track settings:', track.getSettings());
        });

        // Create MediaRecorder to capture audio chunks
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
            // Combine all chunks into a single blob
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const arrayBuffer = await audioBlob.arrayBuffer();
            
            // Only send if there's substantial audio data (> 5KB to avoid sending silence)
            if (arrayBuffer.byteLength > 5120) {
              console.log(`✅ Sending audio to server: ${arrayBuffer.byteLength} bytes`);

              // Send to WebSocket
              if (this.wsConnected) {
                this.wsService.sendAudio(arrayBuffer);
              }
            } else {
              console.log(`⏭️ Skipping silent/empty audio chunk: ${arrayBuffer.byteLength} bytes (threshold: 5KB)`);
            }

            audioChunks = [];
          }
        };

        // Record in chunks (send every 10 seconds for better sentence detection)
        mediaRecorder.start();
        const chunkInterval = setInterval(() => {
          if (mediaRecorder && mediaRecorder.state === 'recording' && this.screenShareActive) {
            mediaRecorder.stop();
            mediaRecorder.start(); // Start new chunk
          } else {
            clearInterval(chunkInterval);
          }
        }, 10000); // 10 second chunks for better sentence boundaries

        // Store references for cleanup
        (this as any).screenMediaRecorder = mediaRecorder;
        (this as any).screenChunkInterval = chunkInterval;
        
        // Auto-stop when audio track ends
        audioTracks.forEach(track => {
          track.onended = () => {
            console.log('Audio track ended - stopping recording');
            this.stopScreenShareWithAudio();
          };
        });
      }

      this.screenShareActive = true;
      this.wsConnectionError = '';

      // Handle when user stops sharing
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        this.stopScreenShareWithAudio();
      });

    } catch (error: any) {
      console.error('Screen share with audio error:', error);
      
      if (error.name === 'NotAllowedError') {
        this.wsConnectionError = 'Permission denied. Click "Share" when dialog appears.';
      } else if (error.message && error.message.includes('No audio track')) {
        this.wsConnectionError = error.message;
      } else {
        this.wsConnectionError = 'Failed to capture screen/audio.';
      }
      
      this.cd.detectChanges();
    }
  }

  stopScreenShareWithAudio(): void {
    // Set flag to false first to prevent any more processing
    this.screenShareActive = false;
    
    // Clear interval first
    if ((this as any).screenChunkInterval) {
      clearInterval((this as any).screenChunkInterval);
      (this as any).screenChunkInterval = null;
    }

    // Stop media recorder
    if ((this as any).screenMediaRecorder) {
      const mediaRecorder = (this as any).screenMediaRecorder;
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      (this as any).screenMediaRecorder = null;
    }
    
    // Stop video
    const videoElement = this.screenVideo.nativeElement;
    if (videoElement.srcObject) {
      const stream = videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoElement.srcObject = null;
    }
    
    this.cd.detectChanges();
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
      // Connect to WebSocket if not already connected
      if (!this.wsConnected) {
        await this.connectWebSocket();
      }

      // Start microphone recording with WebSocket transcription
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

  // WebSocket Transcription Methods
  async connectWebSocket(): Promise<void> {
    try {
      await this.wsService.connect();
      this.wsConnectionError = '';
    } catch (error) {
      this.wsConnectionError = 'Failed to connect to transcription service';
      console.error('WebSocket connection error:', error);
    }
  }

  disconnectWebSocket(): void {
    this.wsService.disconnect();
  }

  private isGarbageText(text: string): boolean {
    // Common Whisper hallucination artifacts
    const garbagePatterns = [
      /^(you|um|uh|ah|mm|hmm)$/i,
      /^\s*$/,
      /^[\.\,\!\?]+$/,
      /thank you for watching/i,
      /subscribe/i,
      /^\[.*\]$/  // [Music], [Applause], etc.
    ];
    
    return garbagePatterns.some(pattern => pattern.test(text));
  }

  private formatTranscription(text: string): string {
    if (!text) return text;
    
    // Capitalize first letter
    let formatted = text.charAt(0).toUpperCase() + text.slice(1);
    
    // Add punctuation if missing
    const lastChar = formatted.charAt(formatted.length - 1);
    if (!/[.!?]$/.test(formatted)) {
      // Detect if it's a question
      if (/^(what|where|when|who|why|how|is|are|can|could|would|should|do|does|did)/i.test(formatted)) {
        formatted += '?';
      } else {
        formatted += '.';
      }
    }
    
    return formatted;
  }
}
