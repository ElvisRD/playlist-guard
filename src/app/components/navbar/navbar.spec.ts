import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Component, signal } from '@angular/core';
import { Navbar } from './navbar';
import { Google } from '../../services/google';
import { Dialog } from '../../services/dialog';
import { Toast } from '../../services/toast';
import { Profile } from '../../models';

@Component({ template: '' })
class BlankPage {}

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;

  const googleMock = {
    profile: signal<Profile | null>(null),
    loading: signal(false),
    authenticateWithGoogle: vi.fn(() => of({})),
    loadProfile: vi.fn(),
    logout: vi.fn(() => of({})),
  } as unknown as Google;

  const dialogMock = { open: vi.fn() } as unknown as Dialog;
  const toastMock = { show: vi.fn() } as unknown as Toast;

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([
          { path: '', component: BlankPage },
          { path: 'playlists', component: BlankPage },
        ]),
        { provide: Google, useValue: googleMock },
        { provide: Dialog, useValue: dialogMock },
        { provide: Toast, useValue: toastMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle the mobile menu', () => {
    expect(component.mobileMenuOpen()).toBe(false);
    component.toggleMobileMenu();
    expect(component.mobileMenuOpen()).toBe(true);
    component.toggleMobileMenu();
    expect(component.mobileMenuOpen()).toBe(false);
  });

  it('should close the mobile menu', () => {
    component.mobileMenuOpen.set(true);
    component.closeMobileMenu();
    expect(component.mobileMenuOpen()).toBe(false);
  });

  it('should start login and show success toast on success', () => {
    component.loginWithGoogle();
    expect(googleMock.authenticateWithGoogle).toHaveBeenCalledTimes(1);
    expect(googleMock.loadProfile).toHaveBeenCalledTimes(1);
    expect(toastMock.show).toHaveBeenCalledWith('success', 'Sesión iniciada correctamente.');
  });

  it('should log the error when login fails', () => {
    googleMock.authenticateWithGoogle = vi.fn(() =>
      throwError(() => new Error('Login fallido')),
    ) as never;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    component.loginWithGoogle();

    expect(errorSpy).toHaveBeenCalledWith('Login fallido');
    expect(googleMock.loadProfile).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('should logout and show a success toast', () => {
    component.openDialogLogout();
    expect(googleMock.logout).toHaveBeenCalledTimes(1);
    expect(toastMock.show).toHaveBeenCalledWith('success', 'Sesión cerrada correctamente.');
  });

  it('should log the error when logout fails', () => {
    googleMock.logout = vi.fn(() => throwError(() => new Error('Logout fallido'))) as never;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    component.openDialogLogout();

    expect(errorSpy).toHaveBeenCalledWith('Logout fallido');
    errorSpy.mockRestore();
  });

  it('should replace the profile image with a placeholder on error', () => {
    const img = document.createElement('img');
    img.src = 'http://broken.example/image.png';
    component.onImageError({ target: img } as unknown as Event);
    expect(img.src).toContain('data:image/svg+xml');
  });

  it('should render the login button when not logged in and not loading', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Iniciar Sesión');
  });

  it('should render the logout button when logged in', () => {
    googleMock.profile.set({
      email: 'a@example.com',
      name: 'User',
      picture: 'https://example.com/a.png',
    });
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Cerrar Sesión');
  });

  describe('active link', () => {
    const activeClass = 'text-custom-purple';

    const linkTo = (label: string) =>
      Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a')).find(
        (a) => a.textContent?.trim() === label,
      )!;

    const login = () => {
      googleMock.profile.set({
        email: 'a@example.com',
        name: 'User',
        picture: 'https://example.com/a.png',
      });
      fixture.detectChanges();
    };

    it('should highlight "Inicio" on the home route', async () => {
      const router = TestBed.inject(Router);
      login();

      await router.navigate(['/']);
      fixture.detectChanges();

      expect(linkTo('Inicio').classList).toContain(activeClass);
      expect(linkTo('Mis playlists').classList).not.toContain(activeClass);
      expect(linkTo('Inicio').getAttribute('aria-current')).toBe('page');
    });

    it('should move the highlight to "Mis playlists" on the playlists route', async () => {
      const router = TestBed.inject(Router);
      login();

      await router.navigate(['/playlists']);
      fixture.detectChanges();

      expect(linkTo('Mis playlists').classList).toContain(activeClass);
      expect(linkTo('Inicio').classList).not.toContain(activeClass);
    });

    it('should keep "Inicio" active while navigating back from playlists', async () => {
      const router = TestBed.inject(Router);
      login();

      await router.navigate(['/playlists']);
      await router.navigate(['/']);
      fixture.detectChanges();

      expect(linkTo('Inicio').classList).toContain(activeClass);
      expect(linkTo('Mis playlists').classList).not.toContain(activeClass);
    });

    it('should animate the underline indicator through the active class', async () => {
      const router = TestBed.inject(Router);
      login();

      const link = linkTo('Inicio');
      expect(link.className).toContain('after:scale-x-0');
      expect(link.className).toContain('after:transition-all');

      await router.navigate(['/']);
      fixture.detectChanges();

      expect(link.className).toContain('after:scale-x-100');
      expect(link.className).toContain('after:opacity-100');
    });
  });
});
