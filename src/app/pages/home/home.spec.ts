import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { Home } from './home';
import { Google } from '../../services/google';
import { Youtube } from '../../services/youtube';
import { Toast } from '../../services/toast';
import { Dialog } from '../../services/dialog';
import type { AccessCheckResponse, Playlist, Profile } from '../../models';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  const profile: Profile = {
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/avatar.png',
  };

  const googleMock = {
    profile: signal<Profile | null>(profile),
    authenticateWithGoogle: vi.fn(() => of(profile)),
    logout: vi.fn(() => of({})),
    loadProfile: vi.fn(),
  } as unknown as Google;

  const playlist: Playlist = {
    id: 'PL123',
    title: 'Mi Playlist',
    description: 'Descripción',
    thumbnail: 'thumb',
    totalVideos: 10,
    protect: false,
    updatedAt: '2024-01-01T00:00:00Z',
    videos: [],
  };

  const youtubeMock = {
    verifyAccessPlaylist: vi.fn(),
    savePlaylist: vi.fn(),
  } as unknown as Youtube;

  const toastMock = { show: vi.fn() } as unknown as Toast;
  const dialogMock = { open: vi.fn() } as unknown as Dialog;

  beforeEach(async () => {
    vi.clearAllMocks();
    googleMock.profile.set(profile);

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
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should extract playlist id from URL', () => {
    component.playlistUrl = 'https://www.youtube.com/playlist?list=PL123&feature=share';
    const accessResponse: AccessCheckResponse = { hasAccess: true, playlist };
    youtubeMock.verifyAccessPlaylist = vi.fn(() => of(accessResponse)) as never;

    component.searchPlaylist();

    expect(youtubeMock.verifyAccessPlaylist).toHaveBeenCalledWith('PL123');
    expect(component.playlist()).toEqual(playlist);
  });

  it('should show not-found toast for invalid URL', () => {
    component.playlistUrl = 'https://www.youtube.com/watch?v=abc';

    component.searchPlaylist();

    expect(toastMock.show).toHaveBeenCalledWith('not-found');
    expect(youtubeMock.verifyAccessPlaylist).not.toHaveBeenCalled();
  });

  it('should open unauthorized dialog when not logged in', () => {
    googleMock.profile.set(null) as never;
    component.playlistUrl = 'https://www.youtube.com/playlist?list=PL123';

    component.searchPlaylist();

    expect(dialogMock.open).toHaveBeenCalledWith('unauthorized');
  });

  it('should open not-access dialog when user has no access', () => {
    const accessResponse: AccessCheckResponse = { hasAccess: false, playlist };
    youtubeMock.verifyAccessPlaylist = vi.fn(() => of(accessResponse)) as never;
    component.playlistUrl = 'https://www.youtube.com/playlist?list=PL123';

    component.searchPlaylist();

    expect(dialogMock.open).toHaveBeenCalledWith('not-access');
  });

  it('should handle verification error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    youtubeMock.verifyAccessPlaylist = vi.fn(() => throwError(() => new Error('Network error'))) as never;
    component.playlistUrl = 'https://www.youtube.com/playlist?list=PL123';

    component.searchPlaylist();

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('should save playlist and show success toast', () => {
    youtubeMock.savePlaylist = vi.fn(() => of({})) as never;
    component.playlist.set(playlist);

    component.savePlaylist('PL123');

    expect(youtubeMock.savePlaylist).toHaveBeenCalledWith('PL123');
    expect(toastMock.show).toHaveBeenCalledWith('success', 'La playlist fue guardada exitosamente.');
    expect(component.playlist()).toBeNull();
  });

  it('should handle save error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    youtubeMock.savePlaylist = vi.fn(() => throwError(() => new Error('Save failed'))) as never;

    component.savePlaylist('PL123');

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
