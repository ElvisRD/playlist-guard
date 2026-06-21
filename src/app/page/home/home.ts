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
      this.dialogVisible.set(true);
      return;
    }

    this.verifyPlaylist(idList);
  }

  createDialog(type: string){
    switch(type){
      case 'options':
        this.dialogType.set('playlist-options');
        this.dialogData.set({
          title: 'Opciones Playlist',
        });
        break;
      case 'not-found':
        this.dialogType.set('not-found');
        this.dialogData.set({
          title: 'Playlist no encontrada',
          text: 'No se encontró un ID de playlist en la URL proporcionada.'
        });
        break;
      case 'private':
        this.dialogType.set('private-playlist');
        this.dialogData.set({
          title: 'La playlist es privada',
          text: 'Para acceder a esta playlist, es necesario autenticarse con Google.',
        });
        break;
      case 'error':
        this.dialogType.set('error');
        this.dialogData.set({
          title: 'Error',
          text: 'Ocurrió un error al verificar la playlist. Intenta de nuevo más tarde.'
        });
        break;
      default:
        break;
    }
    this.dialogVisible.set(true);
  }

  verifyPlaylist(idList: string) {
    this.youtube.verifyPlaylist(idList).subscribe({
      next: (res) => {
        res.authRequired ? this.createDialog('private') : this.createDialog('options');
      },
      error: (error) => {
        console.error('Error verifying playlist:', error);
        this.createDialog('error');
      }
    });
  }

  onDialogClose() {
    this.dialogVisible.set(false);
  }
}
