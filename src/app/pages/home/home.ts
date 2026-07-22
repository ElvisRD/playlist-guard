import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Youtube } from '../../services/youtube';
import { Google } from '../../services/google';
import { Toast } from '../../services/toast';
import { Dialog } from '../../services/dialog';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [NgClass],
  templateUrl: './home.html',
  styleUrl: './home.css',
  host: {
    class: 'flex flex-1 flex-col w-full h-full'
  }
})
export class Home {
  private googleService = inject(Google);
  private youtubeService = inject(Youtube);
  private toastService = inject(Toast);
  private dialogService = inject(Dialog);
  protected profile = toSignal(this.googleService.profile$, { initialValue: null });
  playlist = signal<any>(null);
  playlistUrl = '';
  loaderPlaylist = false;

  benefits = [
  {
    icon: 'pi pi-history',
    title: 'Historial e Identificación',
    description: 'Descubre al instante el nombre de los videos privados o borrados de tu lista de reproducción.'
  },
  {
    icon: 'pi pi-bell',
    title: 'Alertas de Cambios',
    description: 'Recibe notificaciones automáticas cuando YouTube modifique o elimine contenido de tus playlists.'
  },
  {
    icon: 'pi pi-save',
    title: 'Respaldo Seguro',
    description: 'Guarda una copia fija del estado original de tu playlist para consultar la lista exacta cuando la necesites.'
  }
];


  searchPlaylist() {
    const idList = this.playlistUrl.split('list=')[1];

    if (!idList) {
      this.toastService.show('not-found');
      return;
    }

    this.verifyPlaylist(idList);
  }

  verifyPlaylist(idList: string) {
    this.youtubeService.verifyPlaylist(idList).subscribe({
      next: (res) => {
        if (res.hasAccess) {
          console.log(res)
          this.playlist.set(res.playlist);
        } else {
          this.dialogService.open('not-access');
        }
      },
      error: (error) => {
        console.error('Error verifying playlist:', error);
        switch (error.status) {
          case 401:
            this.toastService.show('unauthorized');
            break;
          case 404:
            this.toastService.show('not-found');
            break;
          default:
            this.dialogService.open('error');
            break;
        }
      },
    });
  }

  savePlaylist(playlistId: string) {
    this.youtubeService.savePlaylist(playlistId).subscribe({
      next: (res) => {
        this.toastService.show('success', 'La playlist fue guardada exitosamente.');
        this.playlist.set(null);
      },
      error: (error) => {
        console.error(error)
      }
    })
  }
}
