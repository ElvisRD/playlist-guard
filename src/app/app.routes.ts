import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Playlists } from './pages/playlists/playlists';
import { Playlist } from './pages/playlist/playlist';
import { Privacy } from './pages/privacy/privacy';
import { Terms } from './pages/terms/terms';
import { NotificationComponent } from './pages/notification/notification';
import { authGuard } from './guards/auth';
import { adminGuard } from './guards/admin';
import { Admin } from './pages/admin/admin';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'playlists', component: Playlists, canActivate: [authGuard] },
  { path: 'playlist/:id', component: Playlist, canActivate: [authGuard] },
  { path: 'notifications', component: NotificationComponent, canActivate: [authGuard] },
  { path: 'privacidad', component: Privacy },
  { path: 'admin', component: Admin, canActivate: [adminGuard] },
  { path: 'terminos', component: Terms },
  { path: '**', redirectTo: '' },
];
