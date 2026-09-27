import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-oauth-callback',
  imports: [],
  templateUrl: './oauth-callback.html',
  styleUrl: './oauth-callback.css',
})
export class OauthCallback implements OnInit {
  ngOnInit() {
    const bc = new BroadcastChannel('auth');
    bc.postMessage({ type: 'auth-success' });
    bc.close();
    window.close();
  }
}
