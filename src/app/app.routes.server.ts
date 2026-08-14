import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'auth/callback',
    renderMode: RenderMode.Client,
  },
  {
    path: 'playlists',
    renderMode: RenderMode.Client,
  },
  {
    path: 'playlist/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
