import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationSubscription, PlaylistSummary } from '../../../models';

@Component({
  selector: 'app-notification-status',
  imports: [CommonModule],
  templateUrl: './notification-status.html',
  styleUrl: './notification-status.css',
})
export class NotificationStatus {
  subscription = input<NotificationSubscription | null>(null);
  playlists = input<PlaylistSummary[]>([]);
  playlistsTitles: string[] = [];
  refresh = output<void>();

  showTitlePlaylists = computed(() => {
    const sub = this.subscription();

    if (sub?.playlistIds) {
      return this.playlists()
        .filter((playlist) => sub.playlistIds!.includes(playlist.id))
        .map((playlist) => playlist.title).join(', ');
    }

    return 'No se encontró ninguna playlist asociada a la suscripción.'
  });

  onRefresh() {
    this.refresh.emit();
  }
}
