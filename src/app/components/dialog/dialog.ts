import { Component, signal, effect, inject } from '@angular/core';
import { Youtube } from '../../services/youtube';
import { Google } from '../../services/google';
import { Router } from '@angular/router';
import { Dialog as DialogService } from '../../services/dialog';
import { ToastText } from '../../models';

@Component({
  selector: 'app-dialog',
  imports: [],
  templateUrl: './dialog.html',
  styleUrl: './dialog.css',
})
export class Dialog {
  private dialogService = inject(DialogService);
  private youtubeService = inject(Youtube);
  private googleService = inject(Google);
  private router = inject(Router);

  visible = this.dialogService.visible;
  type = this.dialogService.type;
  playlist = this.dialogService.playlist;

  private dialogTexts: Record<string, ToastText> = {};
  dialogConfig = signal<ToastText | null>(null);

  constructor() {
    effect(() => {
      const currentType = this.type();
      if (currentType && this.dialogTexts[currentType]) {
        this.dialogConfig.set(this.dialogTexts[currentType]);
      }
    });
  }

  onConfirmDelete() {
    const playlistId = this.playlist();
    if (!playlistId) return;

    this.youtubeService.deletePlaylist(playlistId).subscribe({
      next: () => {
        this.onClose();
        this.router.navigate(['/playlists']);
      },
      error: (err) => console.error(err.message),
    });
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
