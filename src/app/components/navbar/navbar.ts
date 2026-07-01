import { Component, inject, effect, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Google } from '../../services/google';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  loadUser = signal(false);
  private googleService = inject(Google);
  protected profile = toSignal(this.googleService.profile$, { initialValue: null });

  constructor() {
    effect(() => {
      const p = this.profile();
      if (p) this.loadUser.set(false);
      else this.loadUser.set(true);
    });
  }

  loginWithGoogle() {
    this.googleService.authenticateWithGoogle().subscribe({
      next: () => {
        this.googleService.loadProfile()
      },
      error: (err) => console.error(err.message),
    });
  }

  logout() {
    console.log(this.profile());
  }
}
