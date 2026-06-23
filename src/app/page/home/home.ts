import { Component, signal } from '@angular/core';
import { Dialog } from '../../components/dialog/dialog';
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
  dialogData = signal<any>({ type: 'options', title: 'Opciones Playlist'});

  constructor(
    private youtube: Youtube
  ){}

  searchPlaylist() {
    const idList = this.playlistUrl.split('list=')[1];

    if (!idList) {
      this.createDialog('not-found');
      this.dialogVisible.set(true);
      return;
    }

    this.verifyPlaylist(idList);
  }

  createDialog(type: string){
    switch(type){
      case 'options':
        this.dialogData.set({
          type: 'options',
          title: 'Opciones Playlist',
        });
        break;
      case 'not-found':
        this.dialogData.set({
          type: 'not-found',
          title: 'Playlist no encontrada',
          text: 'No se encontró un ID de playlist en la URL proporcionada.'
        });
        break;
      case 'private':
        this.dialogData.set({
          type: 'private',
          title: 'La playlist es privada',
          text: 'Para acceder a esta playlist, es necesario autenticarse con Google.',
        });
        console.log(this.dialogData());
        break;
      case 'error':
        this.dialogData.set({
          type: 'error',
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
