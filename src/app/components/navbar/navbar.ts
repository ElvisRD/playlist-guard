import { Component, inject, effect, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Google } from '../../services/google';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  
  loadUser = computed(() => !this.profile());
  private googleService = inject(Google);
  protected profile = toSignal(this.googleService.profile$, { initialValue: null });
  
  loginWithGoogle() {
    this.googleService.authenticateWithGoogle().subscribe({
      next: () => {
        this.googleService.loadProfile()
      },
      error: (err) => console.error(err.message),
    });
  }

  logout() {
    this.googleService.logout().subscribe();
  }
}
