import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-oauth-callback',
  imports: [],
  templateUrl: './oauth-callback.html',
  styleUrl: './oauth-callback.css',
})
export class OauthCallback implements OnInit {
  ngOnInit() {
    if (window.opener) {
      window.opener.postMessage({ type: 'auth-success' }, window.location.origin);
    }
    window.close();
  }
}
