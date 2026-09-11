import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { Home } from './home';
import { Google } from '../../services/google';
import { Youtube } from '../../services/youtube';
import { Toast } from '../../services/toast';
import { Dialog } from '../../services/dialog';
import type { Playlist, Profile } from '../../models';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  const profile: Profile = { email: 'a@example.com', name: 'A', picture: 'x' };

  const foundPlaylist: Playlist = {
    id: 'PL1',
    title: 'Mi Playlist',
    description: '',
    thumbnail: 'thumb',
    totalVideos: 5,
    protect: false,
    updatedAt: '2024-01-01T00:00:00Z',
    videos: [],
  };

  const googleMock = {
    profile: signal<Profile | null>(null),
  } as unknown as Google;

  const toastMock = { show: vi.fn() } as unknown as Toast;
  const dialogMock = { open: vi.fn() } as unknown as Dialog;

  const youtubeMock = {
    verifyAccessPlaylist: vi.fn(() => of({ hasAccess: true, playlist: foundPlaylist })),
    savePlaylist: vi.fn(() => of({})),
  } as unknown as Youtube;

  beforeEach(async () => {
    vi.clearAllMocks();
    googleMock.profile.set(null);

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        { provide: Google, useValue: googleMock },
        { provide: Youtube, useValue: youtubeMock },
        { provide: Toast, useValue: toastMock },
        { provide: Dialog, useValue: dialogMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the three benefits', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Historial e Identificación');
    expect(compiled.textContent).toContain('Alertas de Cambios');
    expect(compiled.textContent).toContain('Respaldo Seguro');
  });

  it('should show a not-found toast when the url has no list id', () => {
    component.playlistUrl = 'https://youtube.com/watch?v=abc';
    component.searchPlaylist();
    expect(toastMock.show).toHaveBeenCalledWith('not-found');
    expect(youtubeMock.verifyAccessPlaylist).not.toHaveBeenCalled();
  });

  it('should open the unauthorized dialog when the user is not logged in', () => {
    component.playlistUrl = 'https://youtube.com/playlist?list=PL1&other=1';
    component.searchPlaylist();
    expect(dialogMock.open).toHaveBeenCalledWith('unauthorized');
    expect(youtubeMock.verifyAccessPlaylist).not.toHaveBeenCalled();
  });

  it('should verify the playlist when the user is logged in', () => {
    googleMock.profile.set(profile);
    component.playlistUrl = 'https://youtube.com/playlist?list=PL1&other=1';
    component.searchPlaylist();
    expect(youtubeMock.verifyAccessPlaylist).toHaveBeenCalledWith('PL1');
  });

  it('should set the playlist when access is granted', () => {
    component.verifyPlaylist('PL1');
    expect(component.playlist()).toEqual(foundPlaylist);
  });

  it('should open the not-access dialog when access is denied', () => {
    youtubeMock.verifyAccessPlaylist = vi.fn(() =>
      of({ hasAccess: false, playlist: foundPlaylist }),
    ) as never;
    component.verifyPlaylist('PL1');
    expect(dialogMock.open).toHaveBeenCalledWith('not-access');
    expect(component.playlist()).toBeNull();
  });

  it('should save the playlist and show a success toast', () => {
    component.savePlaylist('PL1');
    expect(youtubeMock.savePlaylist).toHaveBeenCalledWith('PL1');
    expect(toastMock.show).toHaveBeenCalledWith(
      'success',
      'La playlist fue guardada exitosamente.',
    );
    expect(component.playlist()).toBeNull();
  });

  it('should log the error when saving the playlist fails', () => {
    youtubeMock.savePlaylist = vi.fn(() => throwError(() => new Error('Error'))) as never;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    component.savePlaylist('PL1');
    expect(errorSpy).toHaveBeenCalled();
    expect(toastMock.show).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
