import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminUsersService } from '../../services/admin/admin-users';
import { Toast } from '../../services/toast/toast';
import { NotificationSubscription } from '../../models';

@Component({
  selector: 'app-admin',
  imports: [],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  host: {
    class: 'flex flex-1 flex-col w-full h-full',
  },
})
export class Admin implements OnInit {
  private adminService = inject(AdminUsersService);
  private toast = inject(Toast);

  subscriptions = signal<NotificationSubscription[]>([]);
  loading = signal(true);
  error = signal(false);
  search = signal('');
  processing = signal<Set<string>>(new Set());

  filtered = computed(() => {
    const query = this.search().toLowerCase().trim();
    const all = this.subscriptions();
    if (!query) return all;
    return all.filter(
      (s) => s.email.toLowerCase().includes(query) || s.userId.toLowerCase().includes(query),
    );
  });

  private searchInput = new Subject<string>();

  ngOnInit() {
    this.searchInput
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((value) => this.search.set(value));

    this.load();
  }

  onSearchChange(event: Event) {
    this.searchInput.next((event.target as HTMLInputElement).value);
  }

  load() {
    this.loading.set(true);
    this.error.set(false);

    this.adminService.getPendingSubscriptions().subscribe({
      next: (subs) => {
        this.subscriptions.set(subs ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  approve(sub: NotificationSubscription) {
    this.setProcessing(sub.id, true);
    this.adminService.approveSubscription(sub.id).subscribe({
      next: () => {
        this.setProcessing(sub.id, false);
        this.toast.show('success', `Suscripción de ${sub.email} aprobada.`);
        this.removeFromList(sub.id);
      },
      error: () => {
        this.setProcessing(sub.id, false);
        this.toast.show('error', 'No se pudo aprobar la suscripción.');
      },
    });
  }

  reject(sub: NotificationSubscription) {
    this.setProcessing(sub.id, true);
    this.adminService.rejectSubscription(sub.id).subscribe({
      next: () => {
        this.setProcessing(sub.id, false);
        this.toast.show('success', `Suscripción de ${sub.email} rechazada.`);
        this.removeFromList(sub.id);
      },
      error: () => {
        this.setProcessing(sub.id, false);
        this.toast.show('error', 'No se pudo rechazar la suscripción.');
      },
    });
  }

  isProcessing(id: string): boolean {
    return this.processing().has(id);
  }

  private setProcessing(id: string, value: boolean) {
    const updated = new Set(this.processing());
    if (value) {
      updated.add(id);
    } else {
      updated.delete(id);
    }
    this.processing.set(updated);
  }

  private removeFromList(id: string) {
    this.subscriptions.set(this.subscriptions().filter((s) => s.id !== id));
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  playlistCount(sub: NotificationSubscription): number {
    const value = sub.playlistIds as unknown;
    if (Array.isArray(value)) return value.length;
    if (typeof value === 'string' && value.length > 0) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        return value.replace(/[{}"]/g, '').split(',').filter(Boolean).length;
      }
    }
    return 0;
  }
}
