import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { Dialog } from './dialog';
import { Dialog as DialogService } from '../../services/dialog';
import { Youtube } from '../../services/youtube';
import { Google } from '../../services/google';
import { Toast } from '../../services/toast';

describe('Dialog Component', () => {
  let component: Dialog;
  let fixture: ComponentFixture<Dialog>;
  let router: Router;

  const dialogServiceMock = {
    visible: signal(false),
    type: signal(null),
    playlist: signal<string | null>(null),
    open: vi.fn(),
    close: vi.fn(),
  } as unknown as DialogService;

  const youtubeMock = {
    deletePlaylist: vi.fn(() => of({})),
  } as unknown as Youtube;

  const googleMock = {
    authenticateWithGoogle: vi.fn(() => of({})),
    loadProfile: vi.fn(),
  } as unknown as Google;

  const toastMock = { show: vi.fn() } as unknown as Toast;

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [Dialog],
      providers: [
        provideRouter([{ path: 'playlists', component: Dialog }]),
        { provide: DialogService, useValue: dialogServiceMock },
        { provide: Youtube, useValue: youtubeMock },
        { provide: Google, useValue: googleMock },
        { provide: Toast, useValue: toastMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dialog);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show dialog when service triggers', () => {
    dialogServiceMock.visible.set(true);
    dialogServiceMock.type.set('delete-playlist');
    dialogServiceMock.playlist.set('PL123');
    fixture.detectChanges();

    expect(component.visible()).toBe(true);
    expect(component.type()).toBe('delete-playlist');
    expect(component.playlist()).toBe('PL123');
  });

  it('should call deletePlaylist on confirm', () => {
    dialogServiceMock.playlist.set('PL123');
    fixture.detectChanges();

    component.onConfirmDelete();

    expect(youtubeMock.deletePlaylist).toHaveBeenCalledWith('PL123');
  });

  it('should show success toast and close dialog after delete', () => {
    dialogServiceMock.playlist.set('PL123');
    fixture.detectChanges();

    component.onConfirmDelete();

    expect(toastMock.show).toHaveBeenCalledWith('success', 'Playlist eliminada correctamente.');
    expect(dialogServiceMock.close).toHaveBeenCalled();
  });

  it('should show error toast on delete failure', () => {
    youtubeMock.deletePlaylist = vi.fn(() => throwError(() => new Error('Failed'))) as never;
    dialogServiceMock.playlist.set('PL123');
    fixture.detectChanges();

    component.onConfirmDelete();

    expect(toastMock.show).toHaveBeenCalledWith('error', 'No se pudo eliminar la playlist.');
  });

  it('should not delete without playlist id', () => {
    dialogServiceMock.playlist.set(null);
    fixture.detectChanges();

    component.onConfirmDelete();

    expect(youtubeMock.deletePlaylist).not.toHaveBeenCalled();
  });

  it('should call authenticateWithGoogle', () => {
    component.authenticateWithGoogle();

    expect(googleMock.authenticateWithGoogle).toHaveBeenCalled();
  });

  it('should show success toast and not refetch the profile after authentication', () => {
    component.authenticateWithGoogle();

    expect(toastMock.show).toHaveBeenCalledWith('success', 'Sesión iniciada correctamente.');
    expect(googleMock.loadProfile).not.toHaveBeenCalled();
  });

  it('should show error toast on authentication failure', () => {
    googleMock.authenticateWithGoogle = vi.fn(() => throwError(() => new Error('Auth fallido'))) as never;

    component.authenticateWithGoogle();

    expect(toastMock.show).toHaveBeenCalledWith('error', 'Auth fallido');
  });

  it('should call service close on close', () => {
    component.onClose();
    expect(dialogServiceMock.close).toHaveBeenCalled();
  });
});

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
