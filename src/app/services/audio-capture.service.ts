import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AudioCaptureService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  
  private recordingStatus = new BehaviorSubject<boolean>(false);
  public recordingStatus$ = this.recordingStatus.asObservable();

  async startRecording(onAudioData: (audioData: ArrayBuffer) => void): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 16000
        }
      });

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        if (this.audioChunks.length > 0) {
          // Combine all chunks into a single blob
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          const arrayBuffer = await audioBlob.arrayBuffer();
          
          // Only send if there's substantial audio data (> 5KB to avoid sending silence)
          if (arrayBuffer.byteLength > 1000) {
            console.log(`[Mic] sending ${arrayBuffer.byteLength} bytes`);
            onAudioData(arrayBuffer);
          } else {
            console.log(`[Mic] skipping tiny chunk: ${arrayBuffer.byteLength} bytes`);
          }
          
          this.audioChunks = [];
        }
      };

      this.mediaRecorder.onstart = () => {
        this.recordingStatus.next(true);
      };

      // 3-second chunks give the server-side VAD enough granularity to detect sentence boundaries
      this.mediaRecorder.start();
      const chunkInterval = setInterval(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
          this.mediaRecorder.start();
        } else {
          clearInterval(chunkInterval);
        }
      }, 3000);

      // Store interval for cleanup
      (this.mediaRecorder as any).chunkInterval = chunkInterval;
      
    } catch (error) {
      console.error('Error starting audio recording:', error);
      throw error;
    }
  }

  async startSystemAudioCapture(onAudioData: (audioData: ArrayBuffer) => void): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1 },
          height: { ideal: 1 }
        } as any,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 16000
        }
      } as any);

      // Check if audio track exists
      const audioTracks = this.stream.getAudioTracks();
      if (audioTracks.length === 0) {
        this.stream.getTracks().forEach(track => track.stop());
        throw new Error('No audio track found! You must check "Share audio" in the dialog.');
      }

      console.log('✅ Audio tracks captured:', audioTracks.length);

      // Create a new stream with only audio
      const audioOnlyStream = new MediaStream();
      audioTracks.forEach(track => {
        audioOnlyStream.addTrack(track);
        console.log('Audio track settings:', track.getSettings());
      });

      // Stop video tracks to save resources
      this.stream.getVideoTracks().forEach(track => {
        track.stop();
      });

      this.stream = audioOnlyStream;

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        if (this.audioChunks.length > 0) {
          // Combine all chunks into a single blob
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          const arrayBuffer = await audioBlob.arrayBuffer();
          console.log(`Sending audio to server: ${arrayBuffer.byteLength} bytes`);
          onAudioData(arrayBuffer);
          this.audioChunks = [];
        }
      };

      this.mediaRecorder.onstart = () => {
        this.recordingStatus.next(true);
      };

      // Record in chunks (send every 5 seconds for real-time transcription)
      this.mediaRecorder.start();
      const chunkInterval = setInterval(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
          this.mediaRecorder.start(); // Start new chunk
        } else {
          clearInterval(chunkInterval);
        }
      }, 5000);

      // Store interval for cleanup
      (this.mediaRecorder as any).chunkInterval = chunkInterval;
      
    } catch (error) {
      console.error('Error starting system audio capture:', error);
      throw error;
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder) {
      // Clear interval if it exists
      if ((this.mediaRecorder as any).chunkInterval) {
        clearInterval((this.mediaRecorder as any).chunkInterval);
      }
      
      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.recordingStatus.next(false);
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
