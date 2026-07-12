import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Google } from '../../services/google';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  
  private googleService = inject(Google);
  protected profile = toSignal(this.googleService.profile$, { initialValue: null });
  protected loading = this.googleService.loading;
  
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
