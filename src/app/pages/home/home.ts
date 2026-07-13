import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Youtube } from '../../services/youtube';
import { Google } from '../../services/google';
import { Toast } from '../../services/toast';
import { Dialog as DialogService } from '../../services/dialog';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private googleService = inject(Google);
  private youtubeService = inject(Youtube);
  private toast = inject(Toast);
  private dialogService = inject(DialogService);
  protected profile = toSignal(this.googleService.profile$, { initialValue: null });

  playlistUrl = '';

  searchPlaylist() {
    const idList = this.playlistUrl.split('list=')[1];

    if (!idList) {
      this.dialogService.open('not-found');
      return;
    }

    this.verifyPlaylist(idList);
  }

  verifyPlaylist(idList: string) {
    this.youtubeService.verifyPlaylist(idList).subscribe({
      next: (res) => {
        if (res.hasAccess) {
          this.dialogService.open('success-playlist', res.playlist, () => this.savePlaylist());
        } else {
          this.dialogService.open('not-access');
        }
      },
      error: (error) => {
        console.error('Error verifying playlist:', error);
        switch (error.status) {
          case 401:
            this.dialogService.open('unauthorized');
            break;
          case 404:
            this.dialogService.open('not-found');
            break;
          default:
            this.dialogService.open('error');
            break;
        }
      },
    });
  }

  savePlaylist() {
    this.toast.show('success', 'Playlist saved successfully!');
  }
}
