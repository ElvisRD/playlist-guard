import { Component, signal, effect, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Youtube } from '../../services/youtube';
import { Google } from '../../services/google';
import { Dialog as DialogService } from '../../services/dialog';

@Component({
  selector: 'app-dialog',
  imports: [],
  templateUrl: './dialog.html',
  styleUrl: './dialog.css',
})
export class Dialog {
  private dialogService = inject(DialogService);
  private http = inject(HttpClient);
  private youtubeService = inject(Youtube);
  private googleService = inject(Google);

  visible = this.dialogService.visible;
  type = this.dialogService.type;
  playlist = this.dialogService.playlist;

  private dialogTexts: Record<string, any> = {};
  dialogConfig = signal<any>(null);

  constructor() {
    effect(() => {
      const currentType = this.type();
      if (currentType && this.dialogTexts[currentType]) {
        this.dialogConfig.set(this.dialogTexts[currentType]);
      }
    });
  }

  onConfirm(){

  }

  authenticateWithGoogle() {
    this.onClose();
    this.googleService.authenticateWithGoogle().subscribe({
      next: () => {
        this.googleService.loadProfile();
      },
      error: (err) => console.error(err.message),
    });
  }


  onClose() {
    this.dialogService.close();
  }
}
