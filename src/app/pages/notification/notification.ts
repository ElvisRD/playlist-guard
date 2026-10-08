import { Component, inject, OnInit, signal } from '@angular/core';
import { Notification } from '../../services/notification/notification';
import { NotificationStatus } from '../../components/notifications/notification-status/notification-status';
import { NotificationForm } from '../../components/notifications/notification-form/notification-form';
import { NotificationSubscription, PlaylistSummary } from '../../models';
import { Dialog } from '../../services/dialog/dialog';
import { Toast } from '../../services/toast/toast';
import { Youtube } from '../../services/youtube/youtube';

@Component({
  selector: 'app-notification',
  imports: [NotificationStatus, NotificationForm],
  templateUrl: './notification.html',
  styleUrl: './notification.css',
  host: {
    class: 'flex flex-1 flex-col w-full h-full',
  },
})
export class NotificationComponent implements OnInit {
  private notificationService = inject(Notification);
  private dialogService = inject(Dialog);
  private toast = inject(Toast);
  private youtubeService = inject(Youtube);

  subscription = this.notificationService.subscription;
  loading = this.notificationService.loading;
  playlists = signal<PlaylistSummary[]>([]);
  playlistAvailable = signal<PlaylistSummary[]>([]);
  testEmailLoading = false;
  unsubscribeLoading = false;

  ngOnInit() {
    this.loadStatus();
    this.loadPlaylists();
  }

  loadPlaylists() {
    this.youtubeService.getPlaylists().subscribe({
      next: (res) => {
        this.playlists.set(res.playlists ?? []);
        this.getAvailablePlaylists();
      },
      error: (err) => {
        console.error('Error al cargar playlists:', err);
      },
    });
  }

  loadStatus() {
    this.loading.set(true);
    this.notificationService.getStatus().subscribe({
      next: (sub) => {
        console.log(sub);
        this.notificationService.subscription.set(sub);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  getAvailablePlaylists() {
  const subIds = this.subscription()?.playlistIds || [];
  const available = this.playlists().filter((playlist) => !subIds.includes(playlist.id));
  this.playlistAvailable.set(available);
}

  onSubscribed(subscription: NotificationSubscription) {
    this.notificationService.subscription.set(subscription);
    this.toast.show('success', 'Suscripción creada correctamente.');
  }

  sendTestEmail() {
    this.testEmailLoading = true;
    this.notificationService.sendTestEmail().subscribe({
      next: () => {
        this.testEmailLoading = false;
        this.toast.show('success', 'Correo de prueba enviado correctamente.');
      },
      error: () => {
        this.testEmailLoading = false;
        this.toast.show('error', 'No se pudo enviar el correo de prueba.');
      },
    });
  }

  unsubscribe() {
    const sub = this.subscription();
    if (!sub) return;

    this.unsubscribeLoading = true;
    this.notificationService.unsubscribe(sub.id).subscribe({
      next: () => {
        this.unsubscribeLoading = false;
        this.notificationService.subscription.set(null);
        this.toast.show('success', 'Suscripción cancelada correctamente.');
      },
      error: () => {
        this.unsubscribeLoading = false;
        this.toast.show('error', 'No se pudo cancelar la suscripción.');
      },
    });

    /* this.dialogService.open('delete-playlist', sub.id, () => {
      this.unsubscribeLoading = true;
      this.notificationService.unsubscribe(sub.id).subscribe({
        next: () => {
          this.unsubscribeLoading = false;
          this.notificationService.subscription.set(null);
          this.toast.show('success', 'Suscripción cancelada correctamente.');
        },
        error: () => {
          this.unsubscribeLoading = false;
          this.toast.show('error', 'No se pudo cancelar la suscripción.');
        },
      });
    }); */
  }
}
