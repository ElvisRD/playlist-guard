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

  getPlaylistExcel(idList: string): Observable<Blob> {
    return this.http.get(this.apiUrl + idList + 'playlist/videos/excel', { responseType: 'blob' });
  }

  getPlaylistText(){
    
  }

  getPlaylists(): Observable<any> {
    return this.http.get(this.apiUrl + 'playlists', { withCredentials: true });
  }

  verifyPlaylist(idList: string): Observable<any> {
    return this.http.get(this.apiUrl + 'playlist/' + idList + '/access', { withCredentials: true });
  }
}
