import { Component, inject, signal, effect, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Google } from '../../services/google';
import { Router } from '@angular/router';
import { Youtube } from '../../services/youtube';
import { Dialog } from '../../services/dialog';

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
  searchQuery = signal('')
  isOpenSelect = signal(false);
  selectFilter = signal('fecha');
  options: Record<string, string> = {
    fecha: 'Fecha',
    ascendente: 'Asc',
    descendente: 'Desc',
  };
  playlists = signal<any[]>([]);
  playlistsLoading = signal(true);

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
        console.log(res)
        this.playlists.set(res.playlists);
      },
      error: (error) => {
        console.error('Error al obtener las playlists:', error);
      },
      complete: () => this.playlistsLoading.set(false),
    });
  }

  filteredPlaylist = computed(() => {
    const playlists = this.playlists() || [];
    const query = this.searchQuery().toLowerCase().trim();
    const filter = this.selectFilter();

    const filtered = query
      ? playlists.filter((playlist: any) => playlist.title.toLowerCase().includes(query))
      : playlists;

    const sorted = [...filtered];

    switch (filter) {
      case 'fecha':
        sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case 'ascendente':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'descendente':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }

    return sorted;
  });

  toggleDropdown() {
    this.isOpenSelect.update(v => !v);
  }

  newPlaylist(){
    this.router.navigate(['']);
  }

  filterName(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  seleccionar(valor: string) {
    this.selectFilter.set(valor);
    this.isOpenSelect.set(false);
  }

  openPlaylist(playlistId: string){
    this.router.navigate(['/playlist/', playlistId]) 
  }

}
