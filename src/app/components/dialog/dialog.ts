import { Component, inject } from '@angular/core';
import { Youtube } from '../../services/youtube';
import { Google } from '../../services/google';
import { Router } from '@angular/router';
import { Dialog as DialogService } from '../../services/dialog';
import { Toast } from '../../services/toast';

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
  private toast = inject(Toast);

  visible = this.dialogService.visible;
  type = this.dialogService.type;
  playlist = this.dialogService.playlist;

  onConfirmDelete() {
    const playlistId = this.playlist();
    if (!playlistId) return;

    this.youtubeService.deletePlaylist(playlistId).subscribe({
      next: () => {
        this.toast.show('success', 'Playlist eliminada correctamente.');
        this.onClose();
        this.router.navigate(['/playlists']);
      },
      error: () => {
        this.toast.show('error', 'No se pudo eliminar la playlist.');
      },
    });
  }

  authenticateWithGoogle() {
    this.onClose();
    this.googleService.authenticateWithGoogle().subscribe({
      next: () => {
        this.googleService.loadProfile();
        this.toast.show('success', 'Sesión iniciada correctamente.');
      },
      error: () => {
        this.toast.show('error', 'No se pudo iniciar sesión.');
      },
    });
  }

  onClose() {
    this.dialogService.close();
  }
}
