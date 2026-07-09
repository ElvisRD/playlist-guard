import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { OauthCallback } from './pages/oauth-callback/oauth-callback';
import { Playlists } from './pages/playlists/playlists';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'auth/callback', component: OauthCallback },
  { path: 'playlists', component: Playlists }
];
