import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Dialog } from '../../components/dialog/dialog';
import { Youtube } from '../../services/youtube';
import { Google } from '../../services/google';

@Component({
  selector: 'app-home',
  imports: [Dialog],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private googleService = inject(Google);
  protected profile = toSignal(this.googleService.profile$, { initialValue: null });

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
      case 'not-access':
        this.dialogData.set({
          type: 'not-access',
          title: 'No tienes acceso a esta playlist',
          text: 'La playlist a la que intentas acceder es privada y le pertenece a otro usuario.',
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
        if(res.hasAccess){
          this.createDialog('options');
        }else{
          this.createDialog('not-access');
        }
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
