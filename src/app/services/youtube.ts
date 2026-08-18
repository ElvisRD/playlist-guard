import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AccessCheckResponse,
  PlaylistsResponse,
  Playlist,
  VerifyPlaylistResponse,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class Youtube {
  private apiUrl = '/youtube/';

  constructor(private http: HttpClient) {}

  savePlaylist(playlistId: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}playlist/save/${playlistId}`, {});
  }

  getPlaylistData(playlistId: string): Observable<Playlist> {
    return this.http.get<Playlist>(`${this.apiUrl}playlist/${playlistId}`);
  }

  getPlaylists(): Observable<PlaylistsResponse> {
    return this.http.get<PlaylistsResponse>(`${this.apiUrl}playlists`);
  }

  verifyAccessPlaylist(listId: string): Observable<AccessCheckResponse> {
    return this.http.get<AccessCheckResponse>(`${this.apiUrl}playlist/${listId}/access`);
  }

  getVerifyPlaylist(body: { playlistId: string }): Observable<VerifyPlaylistResponse> {
    return this.http.post<VerifyPlaylistResponse>(`${this.apiUrl}playlist/compare`, body);
  }

  saveVideosToPlaylist(playlistId: string, videos: unknown[]): Observable<unknown> {
    return this.http.post(`${this.apiUrl}playlist/${playlistId}/save/videos`, { videos });
  }

  deletePlaylist(playlistId: string): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}playlist/${playlistId}`);
  }
}
