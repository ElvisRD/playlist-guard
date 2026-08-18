import { Injectable, signal } from '@angular/core';
import { DialogType } from '../models';

@Injectable({
  providedIn: 'root',
})
export class Dialog {
  visible = signal(false);
  type = signal<DialogType | ''>('');
  playlist = signal<string | null>(null);
  private onSaveCallback: (() => void) | null = null;

  open(type: DialogType, playlistId?: string, onSave?: () => void) {
    this.type.set(type);
    this.playlist.set(playlistId ?? null);
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
