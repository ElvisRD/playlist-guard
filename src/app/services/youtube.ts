import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Youtube {

  private apiUrl = 'http://localhost:3000/youtube/playlist/';
  
  constructor(
    private http: HttpClient
  ) {}

  getPlaylistExcel(idList: string): Observable<Blob> {
    return this.http.get(this.apiUrl + idList + 'videos/excel', { responseType: 'blob' });
  }

  getPlaylistText(){
    
  }

  verifyPlaylist(idList: string): Observable<any> {
    return this.http.get(this.apiUrl + idList + '/access');
  }
}
