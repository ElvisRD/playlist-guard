import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Notification } from '../../../services/notification';
import { NotificationSubscription } from '../../../models';

@Component({
  selector: 'app-notification-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './notification-form.html',
  styleUrl: './notification-form.css',
})
export class NotificationForm {
  private fb = inject(FormBuilder);
  private notificationService = inject(Notification);

  subscribed = output<NotificationSubscription>();

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    playlistIds: [''],
  });

  loading = false;

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.value.email!;
    const playlistIdsRaw = this.form.value.playlistIds;
    const playlistIds = playlistIdsRaw
      ? playlistIdsRaw.split(',').map((id) => id.trim()).filter(Boolean)
      : undefined;

    this.loading = true;
    this.notificationService.subscribe(email, playlistIds).subscribe({
      next: (subscription) => {
        this.loading = false;
        this.subscribed.emit(subscription);
      },
      error: (err) => {
        this.loading = false;
        if (err?.status === 403) {
          alert('No tienes acceso a esta funcionalidad');
        } else if (err?.status === 400) {
          alert('Datos inválidos. Verifica la información ingresada.');
        } else {
          alert('Ocurrió un error. Por favor, intenta nuevamente.');
        }
      },
    });
  }
}
