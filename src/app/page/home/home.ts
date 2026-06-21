import { Component, signal } from '@angular/core';
import { Dialog, DialogData, DialogType } from '../../components/dialog/dialog';
import { Youtube } from '../../services/youtube';

@Component({
  selector: 'app-home',
  imports: [Dialog],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  playlistUrl = '';
  dialogVisible = signal(false);
  dialogType = signal<DialogType>('playlist-options');
  dialogData = signal<DialogData>({ title: 'Opciones Playlist' });

  constructor(
    private youtube: Youtube
  ){}

  searchPlaylist() {
    const idList = this.playlistUrl.split('list=')[1];

    if (!idList) {
      this.dialogType.set('not-found');
      this.dialogData.set({
        title: 'Playlist no encontrada',
        text: 'No se encontró un ID de playlist en la URL proporcionada.'
      });
      this.dialogVisible.set(true);
      return;
    }

    this.verifyPlaylist(idList);
  }

  verifyPlaylist(idList: string) {
    this.youtube.verifyPlaylist(idList).subscribe({
      next: (res) => {
        if (res.authRequired) {
          this.dialogType.set('playlist-options');
          this.dialogData.set({
            title: 'Opciones Playlist',
            authRequired: true
          });
          this.dialogVisible.set(true);
        } else {
          this.dialogType.set('not-found');
          this.dialogData.set({
            title: 'Playlist no encontrada',
            text: 'La playlist no existe o no es accesible.'
          });
          this.dialogVisible.set(true);
        }
      },
      error: (error) => {
        console.error('Error verifying playlist:', error);
        this.dialogType.set('error');
        this.dialogData.set({
          title: 'Error',
          text: 'Ocurrió un error al verificar la playlist. Intenta de nuevo más tarde.'
        });
        this.dialogVisible.set(true);
      }
    });
  }

  onDialogClose() {
    this.dialogVisible.set(false);
  }
}
