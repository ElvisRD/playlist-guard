import { Component, inject, signal, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Google } from '../../services/google';
import { Router } from '@angular/router';
import { Youtube } from '../../services/youtube';

@Component({
  selector: 'app-playlists',
  imports: [],
  templateUrl: './playlists.html',
  styleUrl: './playlists.css',
})
export class Playlists {

  private googleService = inject(Google);
  private youtubeService = inject(Youtube);
  private router = inject(Router);
  protected profile = toSignal(this.googleService.profile$, { initialValue: null });
  private loading = this.googleService.loading;
  playlists = signal<any[]>([]);

  constructor() {
    effect(() => {
      if (!this.loading()) {
        if (!this.profile()) {
          this.router.navigate(['']);
        } else {
          this.getPlaylists();
        }
      }
    });
  }

  getPlaylists() {
    this.youtubeService.getPlaylists().subscribe({
      next: (res) => {
        this.playlists.set(res.playlists);
      },
      error: (error) => {
        console.error('Error al obtener las playlists:', error);
      }
    });
  }

}
