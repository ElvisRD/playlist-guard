import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Component, signal } from '@angular/core';
import { Navbar } from './navbar';
import { Google } from '../../services/google';
import { Dialog } from '../../services/dialog';
import { Toast } from '../../services/toast';
import type { Profile } from '../../models';

@Component({ template: '' })
class DummyComponent {}

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let router: Router;

  const profile: Profile = {
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/avatar.png',
  };

  const googleMock = {
    profile: signal<Profile | null>(null),
    loading: signal(false),
    authenticateWithGoogle: vi.fn(() => {
      googleMock.profile.set(profile);
      return of(profile);
    }),
    logout: vi.fn(() => {
      googleMock.profile.set(null);
      return of({});
    }),
    loadProfile: vi.fn(),
  } as unknown as Google;

  const dialogMock = { open: vi.fn() } as unknown as Dialog;
  const toastMock = { show: vi.fn() } as unknown as Toast;

  beforeEach(async () => {
    vi.clearAllMocks();
    googleMock.profile.set(null);
    googleMock.loading.set(false);
    googleMock.authenticateWithGoogle = vi.fn(() => {
      googleMock.profile.set(profile);
      return of(profile);
    });
    googleMock.logout = vi.fn(() => {
      googleMock.profile.set(null);
      return of({});
    });

    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([
          { path: '', component: DummyComponent },
          { path: 'playlists', component: DummyComponent },
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
    router = TestBed.inject(Router);
  });

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle mobile menu', () => {
    expect(component.mobileMenuOpen()).toBe(false);
    component.toggleMobileMenu();
    expect(component.mobileMenuOpen()).toBe(true);
    component.toggleMobileMenu();
    expect(component.mobileMenuOpen()).toBe(false);
  });

  it('should close mobile menu', () => {
    component.toggleMobileMenu();
    component.closeMobileMenu();
    expect(component.mobileMenuOpen()).toBe(false);
  });

  it('should render the login button when logged out and not loading', () => {
    expect(text()).toContain('Iniciar Sesión');
    expect(text()).not.toContain('Cerrar Sesión');
  });

  it('should render nothing while loading', () => {
    googleMock.loading.set(true);
    fixture.detectChanges();
    expect(text()).not.toContain('Iniciar Sesión');
    expect(text()).not.toContain('Cerrar Sesión');
  });

  it('should render the user and logout button when logged in', () => {
    googleMock.profile.set(profile);
    fixture.detectChanges();
    expect(text()).toContain('Cerrar Sesión');
    expect(text()).not.toContain('Iniciar Sesión');
    const avatar = (fixture.nativeElement as HTMLElement).querySelector(
      'img[alt="Test User"]',
    );
    expect(avatar).toBeTruthy();
  });

  it('should swap the login button for the user after a successful login', () => {
    googleMock.profile.set(null);
    fixture.detectChanges();
    expect(text()).toContain('Iniciar Sesión');

    component.loginWithGoogle();

    expect(googleMock.authenticateWithGoogle).toHaveBeenCalledTimes(1);
    expect(googleMock.profile()).toEqual(profile);
    expect(toastMock.show).toHaveBeenCalledWith(
      'success',
      'Sesión iniciada correctamente.',
    );

    fixture.detectChanges();
    expect(text()).toContain('Cerrar Sesión');
    expect(text()).not.toContain('Iniciar Sesión');
  });

  it('should show an error toast and log the error when login fails', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    googleMock.authenticateWithGoogle = vi.fn(() =>
      throwError(() => new Error('Auth fallido')),
    ) as never;

    component.loginWithGoogle();

    expect(errorSpy).toHaveBeenCalledWith('Auth fallido');
    expect(toastMock.show).toHaveBeenCalledWith('error', 'Auth fallido');
    errorSpy.mockRestore();
  });

  it('should logout, show a success toast and navigate home', () => {
    googleMock.profile.set(profile);
    fixture.detectChanges();
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.openDialogLogout();

    expect(googleMock.logout).toHaveBeenCalledTimes(1);
    expect(toastMock.show).toHaveBeenCalledWith(
      'success',
      'Sesión cerrada correctamente.',
    );
    expect(navigateSpy).toHaveBeenCalledWith(['']);

    fixture.detectChanges();
    expect(text()).toContain('Iniciar Sesión');
    expect(text()).not.toContain('Cerrar Sesión');
  });

  it('should show an error toast when logout fails', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    googleMock.logout = vi.fn(() =>
      throwError(() => new Error('Logout fallido')),
    ) as never;
    googleMock.profile.set(profile);

    component.openDialogLogout();

    expect(errorSpy).toHaveBeenCalledWith('Logout fallido');
    expect(toastMock.show).toHaveBeenCalledWith('error', 'No se pudo cerrar sesión.');
    errorSpy.mockRestore();
  });

  it('should set fallback image on error', () => {
    const img = { src: '' } as HTMLImageElement;
    const event = { target: img } as unknown as Event;

    component.onImageError(event);

    expect(img.src).toContain('data:image/svg+xml');
  });
});