import { Component, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Google } from '../../services/google';
import { Youtube } from '../../services/youtube';

@Component({
  selector: 'app-playlists',
  imports: [],
  templateUrl: './playlists.html',
  styleUrl: './playlists.css',
})
export class Playlists {

  loadUser = computed(() => !this.profile());
  private googleService = inject(Google);
  private youtubeService = inject(Youtube);
  protected profile = toSignal(this.googleService.profile$, { initialValue: null });
  playlists: any[] = [];

  ngOnInit() {
    this.getPlaylists();
  }

  getPlaylists() {
    this.youtubeService.getPlaylists().subscribe({
      next: (res) => {
        console.log(res);
      },
      error: (error) => {
        console.error('Error al obtener las playlists:', error);
      }
    });
  }



}
