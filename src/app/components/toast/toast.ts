import { Component, signal, effect, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgClass } from '@angular/common';
import { Toast as ToastService } from '../../services/toast';

@Component({
  selector: 'app-toast',
  imports: [NgClass],
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

  private typeClasses: Record<string, string> = {
    success: 'border-green-500/40 bg-green-900/60',
    error: 'border-red-500/40 bg-red-900/60',
    warning: 'border-yellow-500/40 bg-yellow-900/60',
    'not-found': 'border-red-500/40 bg-red-900/60',
  };

  displayMessage(): string {
    return this.message() || this.toastConfig()?.text || '';
  }

  classes(): string {
    return this.typeClasses[this.type()] || 'border-zinc-700 bg-zinc-800';
  }

  onClose() {
    this.toastService.close();
  }
}
