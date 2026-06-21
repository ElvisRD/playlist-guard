import { Component } from '@angular/core';
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
  notFoundPlaylist = false;
  dialogVisible = false;
  dataDialog: any = {
    type: 'playlist-not-found',
    title: 'Playlist no encontrada',
    text: '',
    authetication: false
  };

  constructor(
    private youtube: Youtube
  ){}

  searchPlaylist() {
    const idList = this.playlistUrl.split('list=')[1];

    if (!idList) {
      this.notFoundPlaylist = true;
      this.createDialog();
      this.dialogVisible = true;
      return;
    }
   
    this.verifyPlaylist(idList);
  }


  createDialog(){
    if(this.notFoundPlaylist){
      this.dataDialog = {
        type: 'playlist-not-found',
        title: 'No existe la playlist'
      };
      return;
    }

    this.dataDialog = {
      type: 'playlist-options',
      title: 'Opciones Playlist'
    };
  }

  verifyPlaylist(idList: string) {
    this.youtube.verifyPlaylist(idList).subscribe({
      next: (res) => {
        if (res.authRequired) {
          this.dialogVisible = true;
        } else {
          this.notFoundPlaylist = true;
        }
      },
      error: (error) => {
        console.error('Error verifying playlist:', error);
        this.notFoundPlaylist = true;
      }
    })
  }
}
