import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-transcript-panel',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './transcript-panel.component.html',
  styleUrls: ['./transcript-panel.component.scss'],
})
export class TranscriptPanelComponent implements OnInit {
  @ViewChild('screenVideo') screenVideo!: ElementRef<HTMLVideoElement>;

  micStream: MediaStream | null = null;
  micActive: boolean = false;
  recognition: any = null; 
  transcriptLines: string[] = [];
  currentInterimLine: string = '';

  constructor(private cd: ChangeDetectorRef) {}

  ngOnInit(): void {

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        this.submitToInsights();
      }
    });
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
          console.log('Screen sharing stopped.');
        });
      })
      .catch((err) => {
        console.error('Screen share error:', err);
      });
  }

  toggleMicrophone(): void {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (this.micActive) {
      this.micStream?.getTracks().forEach((track) => track.stop());
      this.micStream = null;
      this.micActive = false;

      if (this.recognition) {
        this.recognition.stop();
      }
    } else {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          this.micStream = stream;
          this.micActive = true;
          console.log('Microphone active');

          if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event: any) => {
              let interim = '';
              let final = '';

              for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                  final += transcript;
                } else {
                  interim += transcript;
                }
              }

              if (final) {
                this.transcriptLines.push(final);
                this.currentInterimLine = '';
              } else {
                this.currentInterimLine = interim + '...';
              }

              this.cd.detectChanges();
            };

            this.recognition.onerror = (event: any) => {
              console.error('Speech recognition error:', event.error);
            };

            this.recognition.onend = () => {
              if (this.micActive) {
                this.recognition?.start(); 
              }
            };

            this.recognition.start();
          } else {
            console.warn('SpeechRecognition API not supported in this browser.');
          }
        })
        .catch((err) => {
          console.error('Microphone access denied:', err);
          this.micActive = false;
        });
    }
  }
}
