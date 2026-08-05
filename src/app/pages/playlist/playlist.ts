import { Component, inject, signal, effect, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Youtube } from '../../services/youtube';
import { Google } from '../../services/google';
import { Dialog } from '../../services/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-playlist',
  imports: [FormsModule, CommonModule],
  templateUrl: './playlist.html',
  styleUrl: './playlist.css',
  host: {
    class: 'flex flex-1 flex-col w-full h-full',
  },
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
  searchQuery = signal('');
  isOpenSelect = signal(false);
  selectFilter = signal('fecha');
  showDetailsVerify = signal(true);
  loading = signal(true);
  options: Record<string, string> = {
    fecha: 'Fecha',
    ascendente: 'Asc',
    descendente: 'Desc',
  };
  activeTab = signal('all');
  selectedIds = signal<Set<string>>(new Set());
  selectedCount = computed(() => this.selectedIds().size);
  differences = signal<any>(null);
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
            this.closeDiffs();
          }
        }
      }
    });
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
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
        console.log(res);
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

  closeDiffs() {
    this.activeTab.set('all');
    this.differences.set(null);
    this.searchQuery.set('');
    this.showDetailsVerify.set(false);
  }

  toggleSelect(id: string) {
    const updated = new Set(this.selectedIds());
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }

    this.selectedIds.set(updated);
  }

  addSelectedToPlaylist() {
    console.log('Añadiendo a playlist:', Array.from(this.selectedIds()));
  }

  cancelSelection() {
    this.selectedIds.set(new Set());
  }

  toggleSelectAll() {
    const currentList = this.filteredVideosDiff();
    const updated = new Set(this.selectedIds());

    /* if (this.isAllSelected()) {
      currentList.forEach((v) => updated.delete(v.id));
    } else {
      currentList.forEach((v) => updated.add(v.id));
    } */

    this.selectedIds.set(updated);
  }

  isAllSelected = computed(() => {
    console.log('buenas');
    /*  const currentList = this.filteredVideosDiff();
    return currentList.length > 0 && currentList.every(v => this.selectedIds().has(v.id)); */
  });

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
        sorted.sort(
          (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
        );
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

  filteredVideosDiff = computed(() => {
    const videos = this.differences() || [];
    const query = this.searchQuery().toLowerCase().trim();
    const filter = this.activeTab();

    const filtered = query
      ? videos.filter((video: any) => video.title.toLowerCase().includes(query))
      : videos;

    const sorted = [...filtered];

    return sorted.filter((item) => filter === 'all' || item.type === filter);
  });

  verifyPlaylist() {
    this.showDetailsVerify.set(true);

    const body = {
      playlistId: this.playlist().id,
    };

    this.youtube.getVerifyPlaylist(body).subscribe({
      next: (res: any) => {
        if (res.diff) {
          this.differences.set(
            res.diff.allVideosDiff.map((v: any) => ({
              ...v,
              selected: false, 
            })),
          );
        }
        console.log(this.differences());
      },
      error: (error) => {
        console.error(error);
      },
    });
  }

  filterName(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  toggleDropdown() {
    this.isOpenSelect.update((v) => !v);
  }

  seleccionar(valor: string) {
    this.selectFilter.set(valor);
    this.isOpenSelect.set(false);
  }

  openVideo(videoId: string) {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  }
}
