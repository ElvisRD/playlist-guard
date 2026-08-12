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

  savePlaylist(playlistId: string): Observable<any> {
    return this.http.post(this.apiUrl + 'playlist/save/' +  playlistId, { withCredentials: true })
  }

  getPlaylistData(playlistId: string){
    return this.http.get(this.apiUrl + 'playlist/' + playlistId, { withCredentials: true})
  }

  getPlaylists(): Observable<any> {
    return this.http.get(this.apiUrl + 'playlists', { withCredentials: true });
  }

  verifyAccessPlaylist(listId: string): Observable<any> {
    return this.http.get(this.apiUrl + 'playlist/' + listId + '/access', { withCredentials: true });
  }

  getVerifyPlaylist(body: any){
    return this.http.post(this.apiUrl + 'playlist/compare', body ,{ withCredentials: true} )
  }

  saveVideosToPlaylist(playlistId: string, videos: string[]): Observable<any> {
    return this.http.post(this.apiUrl + 'playlist/' + playlistId + '/save/videos', { videos }, { withCredentials: true });
  }

  deletePlaylist(playlistId: string): Observable<any> {
    return this.http.delete(this.apiUrl + 'playlist/' + playlistId, { withCredentials: true });
  }

}
