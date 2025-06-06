import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-transcript-panel',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './transcript-panel.component.html',
  styleUrls: ['./transcript-panel.component.scss']
})
export class TranscriptPanelComponent {
  
micStream: MediaStream | null = null;
micActive: boolean = false;
 @ViewChild('screenVideo') screenVideo!: ElementRef<HTMLVideoElement>;

 transcriptLines: string[] = [
  'Hi, can you tell me about your experience?',
  'Sure! I’ve worked on multiple Angular apps and backend systems...'
];


startScreenShare() {
  navigator.mediaDevices.getDisplayMedia({ video: true })
    .then(stream => {
      const videoElement = this.screenVideo.nativeElement;
      videoElement.srcObject = stream;
      videoElement.play(); // sometimes needed manually

      stream.getVideoTracks()[0].addEventListener('ended', () => {
        videoElement.srcObject = null;
        console.log('Screen sharing stopped.');
      });
    })
    .catch(err => {
      console.error('Screen share error:', err);
    });
}

toggleMicrophone() {
  if (this.micActive) {
    this.micStream?.getTracks().forEach(track => track.stop());
    this.micStream = null;
    this.micActive = false;
  } else {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        this.micStream = stream;
        this.micActive = true;
        console.log('Microphone active');
        // future: stream to backend or process audio here
      })
      .catch(err => {
        console.error('Microphone access denied:', err);
        this.micActive = false;
      });
  }
}


}
