import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dialog } from '../dialog/dialog';
import { Youtube } from '../../services/youtube';

@Component({
  selector: 'app-home',
  imports: [FormsModule, Dialog],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  playlistUrl = '';
  notFoundPlaylist = false;
  dialogVisible = false;
  authRequiredPlaylist = true;

  constructor(
    private youtube: Youtube
  ){}

  searchPlaylist() {
    const idList = this.playlistUrl.split('list=')[1];

    this.dialogVisible = true;
    if (!idList) return;
   
    this.verifyPlaylist(idList);



  }

  verifyPlaylist(idList: string) {
    this.youtube.verifyPlaylist(idList).subscribe({
      next: (res) => {
        if (res.authRequired) {
          this.dialogVisible = true;
          this.authRequiredPlaylist = true;
        } else {
          this.authRequiredPlaylist = false;
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
