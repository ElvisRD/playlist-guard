import { Injectable, signal } from '@angular/core';
import { ToastType } from '../models';

@Injectable({
  providedIn: 'root',
})
export class Toast {
  visible = signal(false);
  type = signal<ToastType | ''>('');
  title = signal<string>('');
  message = signal<string>('');
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  show(type: ToastType, message?: string) {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.type.set(type);
    this.message.set(message ?? '');
    this.visible.set(true);

    this.timeoutId = setTimeout(() => {
      this.close();
    }, 5000);
  }

  close() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.visible.set(false);
  }
}
