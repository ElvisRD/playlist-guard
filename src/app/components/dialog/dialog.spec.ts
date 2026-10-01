import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { Dialog } from './dialog';
import { Dialog as DialogService } from '../../services/dialog/dialog';
import { Youtube } from '../../services/youtube/youtube';
import { Google } from '../../services/google/google';
import { Toast } from '../../services/toast/toast';

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
    youtubeMock.deletePlaylist = vi.fn(() => of({})) as never;
    googleMock.authenticateWithGoogle = vi.fn(() => of({})) as never;

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

  it('should show delete confirmation dialog', () => {
    dialogServiceMock.visible.set(true);
    dialogServiceMock.type.set('delete-playlist');
    dialogServiceMock.playlist.set('PL123');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Eliminar Playlist');
    expect(compiled.textContent).toContain('¿Estás seguro de que deseas eliminar la playlist?');
  });

  it('should show unauthorized dialog when type is "unauthorized"', () => {
    dialogServiceMock.visible.set(true);
    dialogServiceMock.type.set('unauthorized');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Iniciar sesión');
    expect(compiled.textContent).toContain('Es necesario que inicies sesión con tu cuenta de Google');
  });

  it('should show not-access dialog when type is "not-access"', () => {
    dialogServiceMock.visible.set(true);
    dialogServiceMock.type.set('not-access');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Sin acceso');
    expect(compiled.textContent).toContain('No tienes acceso a esta playlist');
  });

  it('should call onConfirmDelete when delete button is clicked', () => {
    dialogServiceMock.visible.set(true);
    dialogServiceMock.type.set('delete-playlist');
    dialogServiceMock.playlist.set('PL123');
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    const deleteButton = Array.from(buttons).find((btn) =>
      (btn as HTMLButtonElement).textContent?.includes('Eliminar'),
    ) as HTMLButtonElement;
    deleteButton.click();
    fixture.detectChanges();

    expect(youtubeMock.deletePlaylist).toHaveBeenCalledWith('PL123');
  });

  it('should close dialog when cancel button is clicked', () => {
    dialogServiceMock.visible.set(true);
    dialogServiceMock.type.set('delete-playlist');
    dialogServiceMock.playlist.set('PL123');
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    const cancelButton = Array.from(buttons).find((btn) =>
      (btn as HTMLButtonElement).textContent?.includes('Cancelar'),
    ) as HTMLButtonElement;
    cancelButton.click();
    fixture.detectChanges();

    expect(dialogServiceMock.close).toHaveBeenCalled();
  });

  it('should call authenticateWithGoogle when login button is clicked', () => {
    dialogServiceMock.visible.set(true);
    dialogServiceMock.type.set('unauthorized');
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    const loginButton = Array.from(buttons).find((btn) =>
      (btn as HTMLButtonElement).textContent?.includes('Iniciar sesión'),
    ) as HTMLButtonElement;
    loginButton.click();
    fixture.detectChanges();

    expect(googleMock.authenticateWithGoogle).toHaveBeenCalled();
  });

  it('should close dialog when "Entendido" button is clicked', () => {
    dialogServiceMock.visible.set(true);
    dialogServiceMock.type.set('not-access');
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    const entendidoButton = Array.from(buttons).find((btn) =>
      (btn as HTMLButtonElement).textContent?.includes('Entendido'),
    ) as HTMLButtonElement;
    entendidoButton.click();
    fixture.detectChanges();

    expect(dialogServiceMock.close).toHaveBeenCalled();
  });

  it('should show Google icon in unauthorized dialog', () => {
    dialogServiceMock.visible.set(true);
    dialogServiceMock.type.set('unauthorized');
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img[alt="google-icon"]') as HTMLImageElement;
    expect(img).toBeTruthy();
  });

  it('should show close button in dialog header', () => {
    dialogServiceMock.visible.set(true);
    dialogServiceMock.type.set('delete-playlist');
    fixture.detectChanges();

    const closeButton = fixture.nativeElement.querySelector('.pi-times') as HTMLElement;
    expect(closeButton).toBeTruthy();
  });

  it('should navigate to /playlists after successful deletion', () => {
    dialogServiceMock.visible.set(true);
    dialogServiceMock.type.set('delete-playlist');
    dialogServiceMock.playlist.set('PL123');
    fixture.detectChanges();

    const navigateSpy = vi.spyOn(router, 'navigate');
    component.onConfirmDelete();

    expect(navigateSpy).toHaveBeenCalledWith(['/playlists']);
  });

  it('should show error toast when deletion fails', () => {
    youtubeMock.deletePlaylist = vi.fn(() => throwError(() => new Error('Failed'))) as never;
    dialogServiceMock.visible.set(true);
    dialogServiceMock.type.set('delete-playlist');
    dialogServiceMock.playlist.set('PL123');
    fixture.detectChanges();

    component.onConfirmDelete();

    expect(toastMock.show).toHaveBeenCalledWith('error', 'No se pudo eliminar la playlist.');
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
