import { Component, inject, signal } from '@angular/core';
import { Google } from '../../services/google';
import { Dialog } from '../../services/dialog';
import { Toast } from '../../services/toast';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private googleService = inject(Google);
  private dialogService = inject(Dialog);
  private toastService = inject(Toast);
  protected profile = this.googleService.profile;
  protected loading = this.googleService.loading;
  hasNotification = signal(false);
  mobileMenuOpen = signal(false);

  toggleMobileMenu() {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  loginWithGoogle() {
    this.googleService.authenticateWithGoogle().subscribe({
      next: () => {
        this.googleService.loadProfile();
        this.toastService.show('success', 'Sesión iniciada correctamente.');
      },
      error: (err) => console.error(err.message),
    });
  }

  openDialogLogout() {
    this.googleService.logout().subscribe({
      next: () => {
        this.toastService.show('success', 'Sesión cerrada correctamente.');
      },
      error: (err) => console.error(err.message),
    });
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src =
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%2371717a"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="40" font-family="sans-serif">?</text></svg>';
  }
}
