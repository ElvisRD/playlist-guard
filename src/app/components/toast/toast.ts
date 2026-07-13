import { Component, signal, effect, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Toast as ToastService } from '../../services/toast';

@Component({
  selector: 'app-toast',
  imports: [],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class Toast implements OnInit {
  private toastService = inject(ToastService);
  private http = inject(HttpClient);

  visible = this.toastService.visible;
  type = this.toastService.type;
  message = this.toastService.message;

  private toastTexts: Record<string, any> = {};
  toastConfig = signal<any>(null);

  constructor() {
    effect(() => {
      const currentType = this.type();
      if (currentType && this.toastTexts[currentType]) {
        this.toastConfig.set(this.toastTexts[currentType]);
      }
    });
  }

  ngOnInit() {
    this.http.get<Record<string, any>>('/jsons/toastText.json').subscribe({
      next: (data) => {
        this.toastTexts = data;
        const currentType = this.type();
        if (currentType && data[currentType]) {
          this.toastConfig.set(data[currentType]);
        }
      },
      error: (err) => console.error('Error loading toast texts:', err),
    });
  }

  displayMessage(): string {
    return this.message() || this.toastConfig()?.text || '';
  }

  borderClass(): string {
    switch (this.type()) {
      case 'success':
        return 'border-green-500/40';
      case 'error':
        return 'border-red-500/40';
      case 'warning':
        return 'border-yellow-500/40';
      default:
        return 'border-zinc-700';
    }
  }

  bgClass(): string {
    switch (this.type()) {
      case 'success':
        return 'bg-green-900/60';
      case 'error':
        return 'bg-red-900/60';
      case 'warning':
        return 'bg-yellow-900/60';
      default:
        return 'bg-zinc-800';
    }
  }

  onClose() {
    this.toastService.close();
  }
}
