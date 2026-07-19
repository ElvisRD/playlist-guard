import { Component, inject, signal, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms'
import { toSignal } from '@angular/core/rxjs-interop';
import { Youtube } from '../../services/youtube';
import { Google } from '../../services/google';
import { Dialog } from '../../services/dialog';

@Component({
  selector: 'app-playlist',
  imports: [FormsModule],
  templateUrl: './playlist.html',
  styleUrl: './playlist.css',
})
export class Playlist {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private youtube = inject(Youtube);
  private googleService = inject(Google);
  private dialog = inject(Dialog);

  protected profile = toSignal(this.googleService.profile$, { initialValue: null });
  private authLoading = this.googleService.loading;

  playlist = signal<any>(null);
  search: string = ''
  selectFilter: string = '';
  loading = signal(true);
  error: string | null = null;

  constructor() {
    effect(() => {
      if (!this.authLoading()) {
        if (!this.profile()) {
          this.router.navigate(['']);
        } else {
          const id = this.route.snapshot.paramMap.get('id');
          if (id) {
            this.getPlaylistData(id);
          }
        }
      }
    });
  }

  getPlaylistData(playlistId: string) {
    this.loading.set(true);
    this.youtube.getPlaylistData(playlistId).subscribe({
      next: (res) => {
        console.log(res)
        this.playlist.set(res);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        console.error(error);
        switch (error.status) {
          case 401:
            this.dialog.open('unauthorized');
            break;
          default:
            this.error = 'Error al cargar la playlist';
            break;
        }
      },
    });
  }

  openVideo(videoId: string) {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  }
}
