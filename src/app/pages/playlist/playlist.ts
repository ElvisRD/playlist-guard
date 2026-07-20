import { Component, inject, signal, effect, computed } from '@angular/core';
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
  searchQuery = signal('')
  isOpenSelect = signal(false);
  selectFilter = signal('fecha');
  loading = signal(true);
  options: Record<string, string> = {
    fecha: 'Fecha',
    ascendente: 'Asc',
    descendente: 'Desc',
  };
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

  timeAgo = computed(() => {
    const dateInput = new Date(this.playlist().updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - dateInput.getTime();

    const minutes = Math.floor(diffMs / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

    if (days > 0) return rtf.format(-days, 'day');
    if (hours > 0) return rtf.format(-hours, 'hour');
    if (minutes > 0) return rtf.format(-minutes, 'minute');
    
    return 'hace unos instantes';
  });

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

  filteredVideos = computed(() => {
    const videos = this.playlist()?.videos || [];
    const query = this.searchQuery().toLowerCase().trim();
    const filter = this.selectFilter();

    const filtered = query
      ? videos.filter((video: any) => video.title.toLowerCase().includes(query))
      : videos;

    const sorted = [...filtered];

    switch (filter) {
      case 'fecha':
        sorted.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
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

  filterName(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  toggleDropdown() {
    this.isOpenSelect.update(v => !v);
  }

  seleccionar(valor: string) {
    this.selectFilter.set(valor);
    this.isOpenSelect.set(false);
  }

  openVideo(videoId: string) {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  }
}
