import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dialog } from '../dialog/dialog';

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

  searchPlaylist() {
    const idList = this.playlistUrl.split('list=')[1];
  
    if (idList) {
      this.dialogVisible = true;
    }
    
  }
}
