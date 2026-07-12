import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Dialog } from '../../components/dialog/dialog';
import { Youtube } from '../../services/youtube';
import { Google } from '../../services/google';

@Component({
  selector: 'app-home',
  imports: [Dialog],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private googleService = inject(Google);
  private youtubeService = inject(Youtube);
  protected profile = toSignal(this.googleService.profile$, { initialValue: null });

  playlistUrl = '';
  dialogVisible = signal(false);
  playlistData = signal<any>(null);
  dialogType = signal<string>('options');

  searchPlaylist() {
    const idList = this.playlistUrl.split('list=')[1];

    if (!idList) {
      this.createDialog('not-found');
      return;
    }

    this.verifyPlaylist(idList);
  }

  createDialog(type: string) {
    this.dialogType.set(type);
    this.dialogVisible.set(true);
  }

  verifyPlaylist(idList: string) {
    this.youtubeService.verifyPlaylist(idList).subscribe({
      next: (res) => {
        if (res.hasAccess) {
          this.playlistData.set(res.playlist);
          this.createDialog('success-playlist');
        } else {
          this.createDialog('not-access');
        }
        console.log(res);
      },
      error: (error) => {
        console.error('Error verifying playlist:', error);
        switch (error.status) {
          case 401:
            this.createDialog('unauthorized');
            break;
          case 404:
            this.createDialog('not-found');
            break;
          default:
            this.createDialog('error');
            break;
        }
      },
    });
  }

  onDialogClose() {
    this.dialogVisible.set(false);
    this.playlistData.set(null);
  }

  savePlaylist() {
    console.log('buenas')
  }
}
