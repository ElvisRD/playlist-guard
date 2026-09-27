import { http, HttpResponse } from 'msw';
import type {
  AccessCheckResponse,
  Playlist,
  PlaylistsResponse,
  Profile,
  VerifyPlaylistResponse,
} from '../app/models';

const profile: Profile = {
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://example.com/avatar.png',
};

const mockPlaylist: Playlist = {
  id: 'PL123',
  title: 'Mi Playlist de Prueba',
  description: 'Una playlist para testing',
  thumbnail: 'https://example.com/thumb.jpg',
  totalVideos: 12,
  protect: false,
  updatedAt: '2024-01-15T10:30:00Z',
  videos: Array.from({ length: 12 }, (_, i) => ({
    id: `vid${i}`,
    title: `Video ${i}`,
    channelTitle: `Canal ${i}`,
    thumbnail: `https://example.com/thumb${i}.jpg`,
    publishedAt: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
  })),
};

const mockPlaylists: PlaylistsResponse = {
  playlists: [
    { id: 'PL1', title: 'Playlist 1', thumbnail: 't1', totalVideos: 10, updatedAt: '2024-01-10T00:00:00Z' },
    { id: 'PL2', title: 'Playlist 2', thumbnail: 't2', totalVideos: 20, updatedAt: '2024-01-12T00:00:00Z' },
    { id: 'PL3', title: 'Playlist 3', thumbnail: 't3', totalVideos: 15, updatedAt: '2024-01-14T00:00:00Z' },
  ],
};

const mockVerifyResponse: VerifyPlaylistResponse = {
  diff: {
    allVideosDiff: [
      { id: 'new1', title: 'Video Nuevo 1', channelTitle: 'Canal A', thumbnail: 't1', type: 'new' },
      { id: 'new2', title: 'Video Nuevo 2', channelTitle: 'Canal B', thumbnail: 't2', type: 'new' },
      { id: 'vid5', title: 'Video 5', channelTitle: 'Canal 5', thumbnail: 't5', type: 'removed' },
    ],
  },
};

const mockAccessResponse: AccessCheckResponse = {
  hasAccess: true,
  playlist: mockPlaylist,
};

export const handlers = [
  // Google Auth
  http.get('/google-auth/profile', () => {
    return HttpResponse.json(profile);
  }),

  http.post('/google-auth/code', () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.get('/google-auth/logout', () => {
    return new HttpResponse(null, { status: 200 });
  }),

  // YouTube API
  http.get('/youtube/playlists', () => {
    return HttpResponse.json(mockPlaylists);
  }),

  http.get('/youtube/playlist/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({ ...mockPlaylist, id });
  }),

  http.get('/youtube/playlist/:id/access', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({ ...mockAccessResponse, playlist: { ...mockPlaylist, id } });
  }),

  http.post('/youtube/playlist/compare', () => {
    return HttpResponse.json(mockVerifyResponse);
  }),

  http.post('/youtube/playlist/save/:id', () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.post('/youtube/playlist/:id/save/videos', () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.delete('/youtube/playlist/:id', () => {
    return new HttpResponse(null, { status: 200 });
  }),
];
