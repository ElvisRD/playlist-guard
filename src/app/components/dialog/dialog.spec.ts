import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { Dialog } from './dialog';
import { Dialog as DialogService } from '../../services/dialog';
import { Youtube } from '../../services/youtube';
import { Google } from '../../services/google';
import { Toast } from '../../services/toast';
import type { DialogType } from '../../models';

describe('Dialog', () => {
  let component: Dialog;
  let fixture: ComponentFixture<Dialog>;
  let router: Router;

  const dialogServiceMock = {
    visible: signal(false),
    type: signal<DialogType | ''>(''),
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
        provideRouter([]),
        { provide: DialogService, useValue: dialogServiceMock },
        { provide: Youtube, useValue: youtubeMock },
        { provide: Google, useValue: googleMock },
        { provide: Toast, useValue: toastMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dialog);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close the dialog via the service', () => {
    component.onClose();
    expect(dialogServiceMock.close).toHaveBeenCalledTimes(1);
  });

  it('should not delete a playlist when there is no playlist id', () => {
    dialogServiceMock.playlist.set(null);
    component.onConfirmDelete();
    expect(youtubeMock.deletePlaylist).not.toHaveBeenCalled();
  });

  it('should delete the playlist, show a success toast and navigate on success', () => {
    dialogServiceMock.playlist.set('PL1');
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.onConfirmDelete();

    expect(youtubeMock.deletePlaylist).toHaveBeenCalledWith('PL1');
    expect(toastMock.show).toHaveBeenCalledWith('success', 'Playlist eliminada correctamente.');
    expect(dialogServiceMock.close).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/playlists']);
  });

  it('should show an error toast when deleting the playlist fails', () => {
    dialogServiceMock.playlist.set('PL1');
    youtubeMock.deletePlaylist = vi.fn(() => throwError(() => new Error('Error'))) as never;

    component.onConfirmDelete();

    expect(toastMock.show).toHaveBeenCalledWith('error', 'No se pudo eliminar la playlist.');
    expect(dialogServiceMock.close).not.toHaveBeenCalled();
  });

  it('should authenticate with Google and reload the profile on success', () => {
    component.authenticateWithGoogle();
    expect(dialogServiceMock.close).toHaveBeenCalled();
    expect(googleMock.authenticateWithGoogle).toHaveBeenCalledTimes(1);
    expect(googleMock.loadProfile).toHaveBeenCalledTimes(1);
    expect(toastMock.show).toHaveBeenCalledWith('success', 'Sesión iniciada correctamente.');
  });

  it('should show an error toast when authenticating fails', () => {
    googleMock.authenticateWithGoogle = vi.fn(() => throwError(() => new Error('Error'))) as never;

    component.authenticateWithGoogle();

    expect(toastMock.show).toHaveBeenCalledWith('error', 'No se pudo iniciar sesión.');
  });

  it('should render the delete dialog content', () => {
    dialogServiceMock.visible.set(true);
    dialogServiceMock.type.set('delete-playlist');
    dialogServiceMock.playlist.set('PL1');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Eliminar Playlist');
    expect(compiled.textContent).toContain('Eliminar');
  });

  it('should render the unauthorized dialog content', () => {
    dialogServiceMock.visible.set(true);
    dialogServiceMock.type.set('unauthorized');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Iniciar sesión');
  });
});
