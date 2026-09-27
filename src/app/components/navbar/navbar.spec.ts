import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Navbar } from './navbar';
import { Google } from '../../services/google';
import { Dialog } from '../../services/dialog';
import { Toast } from '../../services/toast';
import type { Profile } from '../../models';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;

  const profile: Profile = {
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/avatar.png',
  };

  const googleMock = {
    profile: signal<Profile | null>(profile),
    loading: signal(false),
    authenticateWithGoogle: vi.fn(() => of(profile)),
    logout: vi.fn(() => of({})),
    loadProfile: vi.fn(),
  } as unknown as Google;

  const dialogMock = { open: vi.fn() } as unknown as Dialog;
  const toastMock = { show: vi.fn() } as unknown as Toast;

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([]),
        { provide: Google, useValue: googleMock },
        { provide: Dialog, useValue: dialogMock },
        { provide: Toast, useValue: toastMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
  });

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
    expect(component.mobileMenuOpen()).toBe(true);
    component.closeMobileMenu();
    expect(component.mobileMenuOpen()).toBe(false);
  });

  it('should call loginWithGoogle and show success toast', () => {
    component.loginWithGoogle();

    expect(googleMock.authenticateWithGoogle).toHaveBeenCalled();
    expect(googleMock.loadProfile).toHaveBeenCalled();
    expect(toastMock.show).toHaveBeenCalledWith('success', 'Sesión iniciada correctamente.');
  });

  it('should handle login error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    googleMock.authenticateWithGoogle = vi.fn(() => throwError(() => new Error('Auth failed'))) as never;

    component.loginWithGoogle();

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('should call logout and show success toast', () => {
    component.openDialogLogout();

    expect(googleMock.logout).toHaveBeenCalled();
    expect(toastMock.show).toHaveBeenCalledWith('success', 'Sesión cerrada correctamente.');
  });

  it('should handle logout error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    googleMock.logout = vi.fn(() => throwError(() => new Error('Logout failed'))) as never;

    component.openDialogLogout();

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('should set fallback image on error', () => {
    const img = { src: '' } as HTMLImageElement;
    const event = { target: img } as unknown as Event;

    component.onImageError(event);

    expect(img.src).toContain('data:image/svg+xml');
  });
});

function of<T>(value: T) {
  return {
    subscribe: (callbacks: { next: (v: T) => void; error?: (e: unknown) => void }) => {
      callbacks.next(value);
      return { unsubscribe: () => {} };
    },
  };
}

function throwError<T>(error: () => Error) {
  return {
    subscribe: (callbacks: { next: (v: T) => void; error?: (e: unknown) => void }) => {
      if (callbacks.error) {
        callbacks.error(error());
      }
      return { unsubscribe: () => {} };
    },
  };
}
