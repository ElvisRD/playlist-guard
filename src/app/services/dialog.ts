import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Dialog {
  visible = signal(false);
  type = signal<string>('');
  playlist = signal<any>(null);
  private onSaveCallback: (() => void) | null = null;

  open(type: string, playlist?: any, onSave?: () => void) {
    this.type.set(type);
    this.playlist.set(playlist ?? null);
    this.onSaveCallback = onSave ?? null;
    this.visible.set(true);
  }

  close() {
    this.visible.set(false);
    this.playlist.set(null);
    this.onSaveCallback = null;
  }

  save() {
    if (this.onSaveCallback) {
      this.onSaveCallback();
    }
    this.close();
  }
}
