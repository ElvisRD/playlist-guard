import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Youtube {

  private apiUrl = '/youtube/';
  
  constructor(
    private http: HttpClient
  ) {}

  getPlaylistExcel(listId: string): Observable<Blob> {
    return this.http.get(this.apiUrl + listId + 'playlist/videos/excel', { responseType: 'blob' });
  }

  savePlaylist(playlistId: string): Observable<any> {
    return this.http.post(this.apiUrl + 'playlist/' +  playlistId, { withCredentials: true })
  }

  getPlaylistData(playlistId: string){
    return this.http.get(this.apiUrl + 'playlist/' + playlistId, { withCredentials: true})
  }

  getPlaylists(): Observable<any> {
    return this.http.get(this.apiUrl + 'playlists', { withCredentials: true });
  }

  verifyPlaylist(listId: string): Observable<any> {
    return this.http.get(this.apiUrl + 'playlist/' + listId + '/access', { withCredentials: true });
  }
}
