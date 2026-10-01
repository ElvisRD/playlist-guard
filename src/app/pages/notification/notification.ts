import { Component, inject, OnInit } from '@angular/core';
import { Notification } from '../../services/notification/notification';
import { NotificationStatus } from '../../components/notifications/notification-status/notification-status';
import { NotificationForm } from '../../components/notifications/notification-form/notification-form';
import { NotificationSubscription } from '../../models';
import { Dialog } from '../../services/dialog/dialog';
import { Toast } from '../../services/toast/toast';

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

  subscription = this.notificationService.subscription;
  loading = this.notificationService.loading;
  testEmailLoading = false;
  unsubscribeLoading = false;

  ngOnInit() {
    this.loadStatus();
  }

  loadStatus() {
    this.loading.set(true);
    this.notificationService.getStatus().subscribe({
      next: (sub) => {
        this.notificationService.subscription.set(sub);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
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

    this.dialogService.open('delete-playlist', sub.id, () => {
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
    });
  }
}
