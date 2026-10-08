import { Component, inject, output, signal, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Notification } from '../../../services/notification/notification';
import { NotificationSubscription, PlaylistSummary } from '../../../models';
import { Toast } from '../../../services/toast/toast';

@Component({
  selector: 'app-notification-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './notification-form.html',
  styleUrl: './notification-form.css',
})
export class NotificationForm {
  private fb = inject(FormBuilder);
  private notificationService = inject(Notification);
  private toastService = inject(Toast);

  subscribed = output<NotificationSubscription>();
  playlists = input<PlaylistSummary[]>([]);
  subscription = input<NotificationSubscription | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  loading = false;
  selectedPlaylists = signal<Set<string>>(new Set());
  dropdownOpen = signal(false);

  constructor() {
    effect(() => {
      const allIds = new Set(this.playlists().map((p) => p.id));
      this.selectedPlaylists.set(allIds);
    });
  }

  toggleDropdown() {
    this.dropdownOpen.update((v) => !v);
  }

  closeDropdown() {
    this.dropdownOpen.set(false);
  }

  togglePlaylist(playlistId: string) {
    const updated = new Set(this.selectedPlaylists());
    if (updated.has(playlistId)) {
      updated.delete(playlistId);
    } else {
      updated.add(playlistId);
    }
    this.selectedPlaylists.set(updated);
  }

  isSelected(playlistId: string): boolean {
    return this.selectedPlaylists().has(playlistId);
  }

  get selectedCount(): number {
    return this.selectedPlaylists().size;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if(this.selectedPlaylists().size === 0) {
      this.toastService.show('warning', 'Debes seleccionar al menos una playlist.');
      return;
    }

    const email = this.form.value.email!;
    const playlistIds = Array.from(this.selectedPlaylists());
    
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
