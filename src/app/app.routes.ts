import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { OauthCallback } from './pages/oauth-callback/oauth-callback';
import { Playlists } from './pages/playlists/playlists';
import { Playlist } from './pages/playlist/playlist';
import { Privacy } from './pages/privacy/privacy';
import { Terms } from './pages/terms/terms';
import { authGuard } from './guards/auth';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'auth/callback', component: OauthCallback },
  { path: 'playlists', component: Playlists, canActivate: [authGuard] },
  { path: 'playlist/:id', component: Playlist, canActivate: [authGuard] },
  { path: 'privacidad', component: Privacy },
  { path: 'terminos', component: Terms },
  { path: '**', redirectTo: '' },
];
