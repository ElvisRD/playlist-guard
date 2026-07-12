import { Component, inject, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Google } from '../../services/google';
import { Router } from '@angular/router';
import { Youtube } from '../../services/youtube';

@Component({
  selector: 'app-playlists',
  imports: [],
  templateUrl: './playlists.html',
  styleUrl: './playlists.css',
})
export class Playlists {

  loadUser = computed(() => !this.profile());
  private googleService = inject(Google);
  private youtubeService = inject(Youtube);
  private router = inject(Router);
  protected profile = toSignal(this.googleService.profile$, { initialValue: null });
  playlists = signal<any[]>([]);

  ngOnInit() {
    if(!this.profile()){
      this.router.navigate(['']);
    }

    this.getPlaylists();
  }

  getPlaylists() {
    this.youtubeService.getPlaylists().subscribe({
      next: (res) => {
        this.playlists.set(res.playlists);
        console.log(this.playlists);
      },
      error: (error) => {
        console.error('Error al obtener las playlists:', error);
      }
    });
  }
  
  authenticateWithGoogle(){

  }



}
