import { Routes } from '@angular/router';
import { Home } from './page/home/home';
import { OauthCallback } from './page/oauth-callback/oauth-callback';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'auth/callback', component: OauthCallback },
];
