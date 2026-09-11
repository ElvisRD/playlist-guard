import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Youtube } from './youtube';
import {
  AccessCheckResponse,
  Playlist,
  PlaylistsResponse,
  VerifyPlaylistResponse,
} from '../models';

describe('Youtube service', () => {
  let service: Youtube;
  let httpMock: HttpTestingController;

  const playlist: Playlist = {
    id: 'PL1',
    title: 'Mi Playlist',
    description: '',
    thumbnail: 'thumb',
    totalVideos: 2,
    protect: false,
    updatedAt: '2024-01-01T00:00:00Z',
    videos: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Youtube);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save a playlist via POST', () => {
    service.savePlaylist('PL1').subscribe();
    const req = httpMock.expectOne('/youtube/playlist/save/PL1');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should get playlist data via GET', () => {
    let result: Playlist | undefined;
    service.getPlaylistData('PL1').subscribe((res) => (result = res));
    const req = httpMock.expectOne('/youtube/playlist/PL1');
    expect(req.request.method).toBe('GET');
    req.flush(playlist);
    expect(result).toEqual(playlist);
  });

  it('should get all playlists via GET', () => {
    const response: PlaylistsResponse = {
      playlists: [
        { id: 'PL1', title: 'A', thumbnail: 't', totalVideos: 1, updatedAt: '2024-01-01' },
      ],
    };
    let result: PlaylistsResponse | undefined;
    service.getPlaylists().subscribe((res) => (result = res));
    const req = httpMock.expectOne('/youtube/playlists');
    expect(req.request.method).toBe('GET');
    req.flush(response);
    expect(result).toEqual(response);
  });

  it('should check playlist access via GET', () => {
    const response: AccessCheckResponse = { hasAccess: true, playlist };
    let result: AccessCheckResponse | undefined;
    service.verifyAccessPlaylist('PL1').subscribe((res) => (result = res));
    const req = httpMock.expectOne('/youtube/playlist/PL1/access');
    expect(req.request.method).toBe('GET');
    req.flush(response);
    expect(result).toEqual(response);
  });

  it('should verify a playlist via POST', () => {
    const response: VerifyPlaylistResponse = {
      diff: { allVideosDiff: [] },
    };
    let result: VerifyPlaylistResponse | undefined;
    service.getVerifyPlaylist({ playlistId: 'PL1' }).subscribe((res) => (result = res));
    const req = httpMock.expectOne('/youtube/playlist/compare');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ playlistId: 'PL1' });
    req.flush(response);
    expect(result).toEqual(response);
  });

  it('should save videos to a playlist via POST', () => {
    const videos = [{ id: 'v1', title: 'Video 1' }];
    service.saveVideosToPlaylist('PL1', videos).subscribe();
    const req = httpMock.expectOne('/youtube/playlist/PL1/save/videos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ videos });
    req.flush({});
  });

  it('should delete a playlist via DELETE', () => {
    service.deletePlaylist('PL1').subscribe();
    const req = httpMock.expectOne('/youtube/playlist/PL1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
