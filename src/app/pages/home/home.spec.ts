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

  it('should show playlist card when playlist signal has value', () => {
    component.playlist.set(playlist);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Mi Playlist');
    expect(compiled.textContent).toContain('10 Videos');
  });

  it('should show "Guardar Playlist" button when playlist is not protected', () => {
    component.playlist.set({ ...playlist, protect: false });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Guardar Playlist');
    expect(compiled.textContent).not.toContain('Actualizar Playlist');
  });

  it('should show "Actualizar Playlist" button when playlist is protected', () => {
    component.playlist.set({ ...playlist, protect: true });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Actualizar Playlist');
    expect(compiled.textContent).not.toContain('Guardar Playlist');
  });

  it('should show benefits section when no playlist is searched', () => {
    component.playlist.set(null);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Historial e Identificación');
    expect(compiled.textContent).toContain('Restauración con un Click');
    expect(compiled.textContent).toContain('Respaldo Seguro');
  });

  it('should update playlistUrl on input change', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'https://www.youtube.com/playlist?list=PL456';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.playlistUrl).toBe('https://www.youtube.com/playlist?list=PL456');
  });

  it('should call searchPlaylist on button click', () => {
    const accessResponse: AccessCheckResponse = { hasAccess: true, playlist };
    youtubeMock.verifyAccessPlaylist = vi.fn(() => of(accessResponse)) as never;
    component.playlistUrl = 'https://www.youtube.com/playlist?list=PL123';

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(youtubeMock.verifyAccessPlaylist).toHaveBeenCalledWith('PL123');
  });

  it('should show "Protegida" badge when playlist is protected', () => {
    component.playlist.set({ ...playlist, protect: true });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Protegida');
  });

  it('should show "Vulnerable" badge when playlist is not protected', () => {
    component.playlist.set({ ...playlist, protect: false });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Vulnerable');
  });

  it('should show playlist thumbnail', () => {
    component.playlist.set(playlist);
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img[alt="Playlist Thumbnail"]') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain('thumb');
  });

  it('should show playlist title', () => {
    component.playlist.set(playlist);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Mi Playlist');
  });

  it('should show total videos count', () => {
    component.playlist.set(playlist);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('10 Videos');
  });

  it('should call savePlaylist on save button click', () => {
    youtubeMock.savePlaylist = vi.fn(() => of({})) as never;
    component.playlist.set(playlist);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    const saveButton = Array.from(buttons).find((btn) =>
      (btn as HTMLButtonElement).textContent?.includes('Guardar Playlist'),
    ) as HTMLButtonElement;
    saveButton.click();
    fixture.detectChanges();

    expect(youtubeMock.savePlaylist).toHaveBeenCalledWith('PL123');
  });

  it('should show search input with placeholder', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.placeholder).toContain('Paste YouTube playlist link here');
  });

  it('should show "VERIFICACIÓN INTELIGENTE" badge', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('VERIFICACIÓN INTELIGENTE');
  });

  it('should show problem-oriented headline', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('¿Perdiste videos de tus playlists sin saberlo?');
  });

  it('should show search instruction text', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Introduce la URL de la playlist para buscar sus datos.');
  });

  it('should show feature badges', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Detección al instante');
    expect(compiled.textContent).toContain('Protección de datos');
    expect(compiled.textContent).toContain('Acceso gratuito');
  });
});
