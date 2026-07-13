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

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%2371717a"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="40" font-family="sans-serif">?</text></svg>';
  }
}
