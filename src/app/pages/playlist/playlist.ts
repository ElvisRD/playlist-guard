import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { Youtube } from '../../services/youtube';
import { Google } from '../../services/google';
import { Dialog } from '../../services/dialog';
import { Toast } from '../../services/toast';
import { Playlist as PlaylistModel, VideoDiff } from '../../models';
import { SortDropdown } from '../../components/sort-dropdown/sort-dropdown';

@Component({
  selector: 'app-playlist',
  imports: [FormsModule, NgClass, SortDropdown],
  templateUrl: './playlist.html',
  styleUrl: './playlist.css',
  host: {
    class: 'flex flex-1 flex-col w-full h-full',
  },
})
export class Playlist implements OnInit {
  private route = inject(ActivatedRoute);
  private youtube = inject(Youtube);
  private googleService = inject(Google);
  private dialog = inject(Dialog);
  private toast = inject(Toast);

  protected profile = this.googleService.profile;

  playlist = signal<PlaylistModel | null>(null);
  searchQuery = signal('');
  selectFilter = signal('fecha');
  showDetailsVerify = signal(true);
  loading = signal(true);
  options: Record<string, string> = {
    fecha: 'Fecha',
    ascendente: 'Asc',
    descendente: 'Desc',
  };
  activeTab = signal<'all' | 'new' | 'removed'>('all');
  selectedIds = signal<Set<string>>(new Set());
  selectedCount = computed(() => this.selectedIds().size);
  differences = signal<VideoDiff[] | null>(null);
  error: string | null = null;
  page = signal(1);
  pageSize = 6;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.getPlaylistData(id);
    }
  }

  setTab(tab: 'all' | 'new' | 'removed') {
    this.activeTab.set(tab);
    this.selectedIds.set(new Set());
  }

  timeAgo = computed(() => {
    const playlist = this.playlist();
    if (!playlist) return '';
    const dateInput = new Date(playlist.updatedAt);
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
        this.playlist.set(res);
        this.page.set(1);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        console.error(error);
        this.error = 'Error al cargar la playlist';
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

  selectedVideos = computed(() => {
    const ids = this.selectedIds();
    return (this.differences() || []).filter((video) => ids.has(video.id));
  });

  addSelectedToPlaylist() {
    if (this.selectedCount() === 0) return;

    const videosToAdd = this.selectedVideos().map(({ type, ...video }) => video);

    const playlist = this.playlist();
    if (!playlist) return;

    this.youtube.saveVideosToPlaylist(playlist.id, videosToAdd).subscribe({
      next: () => {
        this.toast.show('success', 'Videos agregados a la playlist correctamente');

        const added = this.selectedVideos().map((video) => ({
          id: video.id,
          title: video.title,
          channelTitle: video.channelTitle,
          thumbnail: video.thumbnail,
          publishedAt: new Date().toISOString(),
        }));
        const addedIds = new Set(added.map((video) => video.id));

        this.playlist.set({
          ...playlist,
          totalVideos: playlist.totalVideos + added.length,
          updatedAt: new Date().toISOString(),
          videos: [...playlist.videos, ...added],
        });

        this.differences.set(
          (this.differences() || []).filter((video) => !addedIds.has(video.id)),
        );
        this.selectedIds.set(new Set());
      },
      error: (error) => {
        console.error(error);
        this.toast.show('error', 'Los videos no se pudieron agregar a la playlist');
      },
    });
  }

  deletePlaylist() {
    const playlist = this.playlist();
    if (playlist) {
      this.dialog.open('delete-playlist', playlist.id);
    }
  }

  cancelSelection() {
    this.selectedIds.set(new Set());
  }

  toggleSelectAll() {
    const currentList = this.selectableVideos();
    const updated = new Set(this.selectedIds());

    if (currentList.every((v) => updated.has(v.id))) {
      currentList.forEach((v) => updated.delete(v.id));
    } else {
      currentList.forEach((v) => updated.add(v.id));
    }

    this.selectedIds.set(updated);
  }

  isAllSelected = computed(() => {
    const currentList = this.selectableVideos();
    return currentList.length > 0 && currentList.every((v) => this.selectedIds().has(v.id));
  });

  selectableVideos = computed(() => this.filteredVideosDiff());

  diffStats = computed(() => {
    const videos = this.differences() || [];
    return {
      new: videos.filter((v) => v.type === 'new').length,
      removed: videos.filter((v) => v.type === 'removed').length,
    };
  });

  filteredVideos = computed(() => {
    const videos = this.playlist()?.videos || [];
    const query = this.searchQuery().toLowerCase().trim();
    const filter = this.selectFilter();

    const filtered = query
      ? videos.filter((video) => video.title.toLowerCase().includes(query))
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

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredVideos().length / this.pageSize)));

  paginatedVideos = computed(() => {
    const videos = this.filteredVideos();
    const currentPage = Math.min(this.page(), this.totalPages());
    const start = (currentPage - 1) * this.pageSize;
    return videos.slice(start, start + this.pageSize);
  });

  pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.page.set(page);
  }

  nextPage() {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
    }
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
    }
  }

  filteredVideosDiff = computed(() => {
    const videos = this.differences() || [];
    const query = this.searchQuery().toLowerCase().trim();
    const filter = this.activeTab();

    const filtered = query
      ? videos.filter((video) => video.title.toLowerCase().includes(query))
      : videos;

    const sorted = [...filtered];

    return sorted.filter((item) => filter === 'all' || item.type === filter);
  });

  verifyPlaylist() {
    this.showDetailsVerify.set(true);

    const playlist = this.playlist();
    if (!playlist) return;

    this.youtube.getVerifyPlaylist({ playlistId: playlist.id }).subscribe({
      next: (res) => {
        if (res.diff) {
          this.differences.set(res.diff.allVideosDiff);
        }
      },
      error: (error) => {
        console.error(error);
      },
    });
  }

  filterName(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.page.set(1);
  }

  seleccionar(valor: string) {
    this.selectFilter.set(valor);
    this.page.set(1);
  }

  openVideo(videoId: string) {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  }
}
