import { Component } from '@angular/core';
import { Google } from '../../services/google';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  constructor(
    private googleService: Google,
    protected auth: AuthService,
  ) {}

  loginWithGoogle() {
    this.googleService.authenticateWithGoogle().subscribe({
      next: (payload) => console.log(payload),
      error: (err) => console.error(err.message),
    });
  }

  logout() {
    this.auth.logout();
  }
}
