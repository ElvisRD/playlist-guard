import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { isSignal, signal } from '@angular/core';
import { Playlist } from './playlist';
import type { Playlist as PlaylistModel, Profile, Video, VideoDiff } from '../../models';
import { Google } from '../../services/google/google';
import { Youtube } from '../../services/youtube/youtube';
import { Dialog } from '../../services/dialog/dialog';
import { Toast } from '../../services/toast/toast';

describe('Playlist', () => {
  let component: Playlist;
  let fixture: ComponentFixture<Playlist>;
  let router: Router;
  let routeId: string | null;

  const googleMock = {
    profile: signal<Profile | null>(null),
  } as unknown as Google;

  const dialogMock = { open: vi.fn() } as unknown as Dialog;
  const toastMock = { show: vi.fn() } as unknown as Toast;

  const youtubeMock = {
    getPlaylistData: vi.fn(),
    saveVideosToPlaylist: vi.fn(),
    getVerifyPlaylist: vi.fn(),
  } as unknown as Youtube;

  const videos: Video[] = [
    {
      id: 'v1',
      title: 'Alpha',
      channelTitle: 'Canal A',
      thumbnail: 't1',
      publishedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'v2',
      title: 'Beta',
      channelTitle: 'Canal B',
      thumbnail: 't2',
      publishedAt: '2024-02-01T00:00:00Z',
    },
    {
      id: 'v3',
      title: 'Gamma',
      channelTitle: 'Canal C',
      thumbnail: 't3',
      publishedAt: '2024-03-01T00:00:00Z',
    },
  ];

  const basePlaylist: PlaylistModel = {
    id: 'PL1',
    title: 'Mi Playlist',
    description: 'Descripción',
    thumbnail: 'thumb',
    totalVideos: 3,
    protect: false,
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    videos: [...videos],
  };

  const diffs: VideoDiff[] = [
    { id: 'v1', title: 'Alpha', channelTitle: 'Canal A', thumbnail: 't1', type: 'new' },
    { id: 'v4', title: 'Delta', channelTitle: 'Canal D', thumbnail: 't4', type: 'new' },
    { id: 'v2', title: 'Beta', channelTitle: 'Canal B', thumbnail: 't2', type: 'removed' },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    routeId = 'PL1';
    youtubeMock.getPlaylistData = vi.fn(() => of(basePlaylist));

    await TestBed.configureTestingModule({
      imports: [Playlist],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => routeId } } },
        },
        { provide: Google, useValue: googleMock },
        { provide: Youtube, useValue: youtubeMock },
        { provide: Dialog, useValue: dialogMock },
        { provide: Toast, useValue: toastMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Playlist);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the playlist on init when an id is present', () => {
    fixture.detectChanges();
    expect(youtubeMock.getPlaylistData).toHaveBeenCalledWith('PL1');
    expect(component.playlist()).toEqual(basePlaylist);
    expect(component.loading()).toBe(false);
  });

  it('should not load anything on init without an id', () => {
    routeId = null;
    fixture.detectChanges();
    expect(youtubeMock.getPlaylistData).not.toHaveBeenCalled();
  });

  it('should set the error when the playlist cannot be loaded', () => {
    youtubeMock.getPlaylistData = vi.fn(() => throwError(() => new Error('Error'))) as never;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    component.getPlaylistData('PL1');
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Error al cargar la playlist');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('should expose the error as a signal, required by the zoneless change detection', () => {
    // A plain field assigned from an HTTP callback never marks the view dirty,
    // so the template would keep showing the spinner after a failed load.
    expect(isSignal(component.error)).toBe(true);
  });

  it('should render the error message after a failed load', async () => {
    youtubeMock.getPlaylistData = vi.fn(() => throwError(() => new Error('Error'))) as never;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    component.getPlaylistData('PL1');
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Error al cargar la playlist');
    expect(compiled.textContent).not.toContain('Cargando datos de la playlist');
    errorSpy.mockRestore();
  });

  it('should clear a previous error when the playlist is requested again', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    youtubeMock.getPlaylistData = vi.fn(() => throwError(() => new Error('Error'))) as never;
    component.getPlaylistData('PL1');
    expect(component.error()).not.toBeNull();

    youtubeMock.getPlaylistData = vi.fn(() => of(basePlaylist)) as never;
    component.getPlaylistData('PL1');
    await fixture.whenStable();

    expect(component.error()).toBeNull();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Error al cargar la playlist');
    errorSpy.mockRestore();
  });

  it('should return an empty time ago without a playlist', () => {
    fixture.detectChanges();
    component.playlist.set(null);
    expect(component.timeAgo()).toBe('');
  });

  it('should say the playlist was updated moments ago when recent', () => {
    component.playlist.set({ ...basePlaylist, updatedAt: new Date().toISOString() });
    expect(component.timeAgo()).toBe('Hace unos instantes');
  });

  it('should format the time ago in days', () => {
    component.playlist.set(basePlaylist);
    expect(component.timeAgo()).toBe('anteayer');
  });

  it('should filter and sort the videos', () => {
    component.playlist.set(basePlaylist);
    component.searchQuery.set('be');
    expect(component.filteredVideos().map((v) => v.id)).toEqual(['v2']);

    component.searchQuery.set('');
    component.selectFilter.set('ascendente');
    expect(component.filteredVideos().map((v) => v.id)).toEqual(['v1', 'v2', 'v3']);

    component.selectFilter.set('descendente');
    expect(component.filteredVideos().map((v) => v.id)).toEqual(['v3', 'v2', 'v1']);
  });

  it('should paginate the videos', () => {
    const manyVideos: Video[] = Array.from({ length: 7 }, (_, i) => ({
      id: `v${i}`,
      title: `Video ${i}`,
      channelTitle: `Canal ${i}`,
      thumbnail: `t${i}`,
      publishedAt: `2024-01-0${i + 1}T00:00:00Z`,
    }));
    fixture.detectChanges();
    component.playlist.set({ ...basePlaylist, videos: manyVideos });

    expect(component.totalPages()).toBe(2);
    expect(component.pageNumbers()).toEqual([1, 2]);
    expect(component.paginatedVideos().length).toBe(6);

    component.nextPage();
    expect(component.page()).toBe(2);
    expect(component.paginatedVideos().length).toBe(1);

    component.prevPage();
    expect(component.page()).toBe(1);

    component.goToPage(3);
    expect(component.page()).toBe(1);
    component.goToPage(0);
    expect(component.page()).toBe(1);

    component.page.set(2);
    component.nextPage();
    expect(component.page()).toBe(2);
  });

  it('should reset the search and page on filter change', () => {
    component.playlist.set(basePlaylist);
    component.page.set(2);
    component.filterName({ target: { value: 'a' } } as unknown as Event);
    expect(component.searchQuery()).toBe('a');
    expect(component.page()).toBe(1);

    component.seleccionar('ascendente');
    expect(component.selectFilter()).toBe('ascendente');
    expect(component.page()).toBe(1);
  });

  it('should compute diff stats', () => {
    component.differences.set(diffs);
    expect(component.diffStats()).toEqual({ new: 2, removed: 1 });
  });

  it('should set the active tab and clear the selection', () => {
    component.differences.set(diffs);
    component.toggleSelect('v1');
    component.setTab('removed');
    expect(component.activeTab()).toBe('removed');
    expect(component.selectedCount()).toBe(0);
  });

  it('should filter diffs by tab and search', () => {
    component.differences.set(diffs);
    expect(component.filteredVideosDiff().map((v) => v.id)).toEqual(['v1', 'v4', 'v2']);

    component.setTab('new');
    expect(component.filteredVideosDiff().map((v) => v.id)).toEqual(['v1', 'v4']);

    component.searchQuery.set('delta');
    expect(component.filteredVideosDiff().map((v) => v.id)).toEqual(['v4']);
  });

  it('should toggle the selection of videos', () => {
    component.differences.set(diffs);
    component.toggleSelect('v1');
    expect(component.selectedCount()).toBe(1);
    component.toggleSelect('v1');
    expect(component.selectedCount()).toBe(0);
  });

  it('should provide the selected videos', () => {
    component.differences.set(diffs);
    component.toggleSelect('v1');
    component.toggleSelect('v4');
    expect(component.selectedVideos().map((v) => v.id)).toEqual(['v1', 'v4']);
  });

  it('should select and deselect all videos', () => {
    component.differences.set(diffs);
    expect(component.isAllSelected()).toBe(false);
    component.toggleSelectAll();
    expect(component.selectedCount()).toBe(3);
    expect(component.isAllSelected()).toBe(true);
    component.toggleSelectAll();
    expect(component.selectedCount()).toBe(0);
    expect(component.isAllSelected()).toBe(false);
  });

  it('should cancel the selection', () => {
    component.differences.set(diffs);
    component.toggleSelectAll();
    component.cancelSelection();
    expect(component.selectedCount()).toBe(0);
  });

  it('should not add videos without a selection', () => {
    component.addSelectedToPlaylist();
    expect(youtubeMock.saveVideosToPlaylist).not.toHaveBeenCalled();
  });

  it('should add the selected videos to the playlist', () => {
    component.playlist.set(basePlaylist);
    component.differences.set(diffs);
    component.toggleSelect('v4');
    youtubeMock.saveVideosToPlaylist = vi.fn(() => of({})) as never;

    component.addSelectedToPlaylist();

    expect(youtubeMock.saveVideosToPlaylist).toHaveBeenCalledWith('PL1', [
      { id: 'v4', title: 'Delta', channelTitle: 'Canal D', thumbnail: 't4' },
    ]);
    expect(toastMock.show).toHaveBeenCalledWith(
      'success',
      'Videos agregados a la playlist correctamente',
    );

    const updated = component.playlist()!;
    expect(updated.totalVideos).toBe(4);
    expect(updated.videos.some((v) => v.id === 'v4')).toBe(true);
    expect(component.differences()!.some((d) => d.id === 'v4')).toBe(false);
    expect(component.selectedCount()).toBe(0);
  });

  it('should show an error toast when adding videos fails', () => {
    component.playlist.set(basePlaylist);
    component.differences.set(diffs);
    component.toggleSelect('v4');
    youtubeMock.saveVideosToPlaylist = vi.fn(() => throwError(() => new Error('Error'))) as never;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    component.addSelectedToPlaylist();

    expect(toastMock.show).toHaveBeenCalledWith(
      'error',
      'Los videos no se pudieron agregar a la playlist',
    );
    errorSpy.mockRestore();
  });

  it('should open the delete dialog for the playlist', () => {
    component.playlist.set(basePlaylist);
    component.deletePlaylist();
    expect(dialogMock.open).toHaveBeenCalledWith('delete-playlist', 'PL1');
  });

  it('should not open the delete dialog without a playlist', () => {
    fixture.detectChanges();
    component.playlist.set(null);
    component.deletePlaylist();
    expect(dialogMock.open).not.toHaveBeenCalled();
  });

  it('should verify the playlist and store the differences', () => {
    component.playlist.set(basePlaylist);
    youtubeMock.getVerifyPlaylist = vi.fn(() => of({ diff: { allVideosDiff: diffs } })) as never;

    component.verifyPlaylist();

    expect(component.showDetailsVerify()).toBe(true);
    expect(youtubeMock.getVerifyPlaylist).toHaveBeenCalledWith({ playlistId: 'PL1' });
    expect(component.differences()).toEqual(diffs);
  });

  it('should skip the differences when the response has no diff', () => {
    component.playlist.set(basePlaylist);
    youtubeMock.getVerifyPlaylist = vi.fn(() => of({ diff: undefined })) as never;

    component.verifyPlaylist();

    expect(component.differences()).toBeNull();
  });

  it('should close the diff view and reset state', () => {
    component.differences.set(diffs);
    component.setTab('new');
    component.searchQuery.set('x');
    component.showDetailsVerify.set(true);

    component.closeDiffs();

    expect(component.activeTab()).toBe('all');
    expect(component.differences()).toBeNull();
    expect(component.searchQuery()).toBe('');
    expect(component.showDetailsVerify()).toBe(false);
  });

  it('should open the video in a new tab', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    component.openVideo('v1');
    expect(openSpy).toHaveBeenCalledWith(
      'https://www.youtube.com/watch?v=v1',
      '_blank',
      'noopener,noreferrer',
    );
    openSpy.mockRestore();
  });

  it('should show loading spinner when loading is true', () => {
    fixture.detectChanges();
    component.playlist.set(null);
    component.loading.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Cargando datos de la playlist');
  });

  it('should show error message when error signal has value', () => {
    fixture.detectChanges();
    component.playlist.set(null);
    component.loading.set(false);
    component.error.set('Error de prueba');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Error de prueba');
  });

  it('should show pagination when totalPages > 1', () => {
    const manyVideos: Video[] = Array.from({ length: 7 }, (_, i) => ({
      id: `v${i}`,
      title: `Video ${i}`,
      channelTitle: `Canal ${i}`,
      thumbnail: `t${i}`,
      publishedAt: `2024-01-0${i + 1}T00:00:00Z`,
    }));
    fixture.detectChanges();
    component.playlist.set({ ...basePlaylist, videos: manyVideos });
    component.loading.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('nav[aria-label="Paginación de videos"]')).toBeTruthy();
  });

  it('should hide pagination when totalPages <= 1', () => {
    component.playlist.set(basePlaylist);
    component.loading.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('nav[aria-label="Paginación de videos"]')).toBeFalsy();
  });

  it('should disable prev button on first page', () => {
    const manyVideos: Video[] = Array.from({ length: 7 }, (_, i) => ({
      id: `v${i}`,
      title: `Video ${i}`,
      channelTitle: `Canal ${i}`,
      thumbnail: `t${i}`,
      publishedAt: `2024-01-0${i + 1}T00:00:00Z`,
    }));
    fixture.detectChanges();
    component.playlist.set({ ...basePlaylist, videos: manyVideos });
    component.loading.set(false);
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector(
      'nav[aria-label="Paginación de videos"]',
    ) as HTMLElement;
    const prevButton = nav.querySelector('button') as HTMLButtonElement;
    expect(prevButton.disabled).toBe(true);
  });

  it('should disable next button on last page', () => {
    const manyVideos: Video[] = Array.from({ length: 7 }, (_, i) => ({
      id: `v${i}`,
      title: `Video ${i}`,
      channelTitle: `Canal ${i}`,
      thumbnail: `t${i}`,
      publishedAt: `2024-01-0${i + 1}T00:00:00Z`,
    }));
    fixture.detectChanges();
    component.playlist.set({ ...basePlaylist, videos: manyVideos });
    component.page.set(2);
    component.loading.set(false);
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector(
      'nav[aria-label="Paginación de videos"]',
    ) as HTMLElement;
    const buttons = nav.querySelectorAll('button');
    const nextButton = buttons[buttons.length - 1] as HTMLButtonElement;
    expect(nextButton.disabled).toBe(true);
  });

  it('should navigate to specific page on page number click', () => {
    const manyVideos: Video[] = Array.from({ length: 7 }, (_, i) => ({
      id: `v${i}`,
      title: `Video ${i}`,
      channelTitle: `Canal ${i}`,
      thumbnail: `t${i}`,
      publishedAt: `2024-01-0${i + 1}T00:00:00Z`,
    }));
    fixture.detectChanges();
    component.playlist.set({ ...basePlaylist, videos: manyVideos });
    component.loading.set(false);
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector(
      'nav[aria-label="Paginación de videos"]',
    ) as HTMLElement;
    const pageButtons = nav.querySelectorAll('button');
    const page2Button = Array.from(pageButtons).find(
      (btn) => (btn as HTMLButtonElement).textContent?.trim() === '2',
    ) as HTMLButtonElement;
    page2Button?.click();
    fixture.detectChanges();

    expect(component.page()).toBe(2);
  });

  it('should show pagination when totalPages > 1', () => {
    const manyVideos: Video[] = Array.from({ length: 7 }, (_, i) => ({
      id: `v${i}`,
      title: `Video ${i}`,
      channelTitle: `Canal ${i}`,
      thumbnail: `t${i}`,
      publishedAt: `2024-01-0${i + 1}T00:00:00Z`,
    }));
    fixture.detectChanges();
    component.playlist.set({ ...basePlaylist, videos: manyVideos });
    component.loading.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('nav[aria-label="Paginación de videos"]')).toBeTruthy();
  });

  it('should hide pagination when totalPages <= 1', () => {
    component.playlist.set(basePlaylist);
    component.loading.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('nav[aria-label="Paginación de videos"]')).toBeFalsy();
  });

  it('should disable prev button on first page', () => {
    const manyVideos: Video[] = Array.from({ length: 7 }, (_, i) => ({
      id: `v${i}`,
      title: `Video ${i}`,
      channelTitle: `Canal ${i}`,
      thumbnail: `t${i}`,
      publishedAt: `2024-01-0${i + 1}T00:00:00Z`,
    }));
    fixture.detectChanges();
    component.playlist.set({ ...basePlaylist, videos: manyVideos });
    component.loading.set(false);
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector(
      'nav[aria-label="Paginación de videos"]',
    ) as HTMLElement;
    const prevButton = nav.querySelector('button') as HTMLButtonElement;
    expect(prevButton.disabled).toBe(true);
  });

  it('should disable next button on last page', () => {
    const manyVideos: Video[] = Array.from({ length: 7 }, (_, i) => ({
      id: `v${i}`,
      title: `Video ${i}`,
      channelTitle: `Canal ${i}`,
      thumbnail: `t${i}`,
      publishedAt: `2024-01-0${i + 1}T00:00:00Z`,
    }));
    fixture.detectChanges();
    component.playlist.set({ ...basePlaylist, videos: manyVideos });
    component.page.set(2);
    component.loading.set(false);
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector(
      'nav[aria-label="Paginación de videos"]',
    ) as HTMLElement;
    const buttons = nav.querySelectorAll('button');
    const nextButton = buttons[buttons.length - 1] as HTMLButtonElement;
    expect(nextButton.disabled).toBe(true);
  });

  it('should navigate to specific page on page number click', () => {
    const manyVideos: Video[] = Array.from({ length: 7 }, (_, i) => ({
      id: `v${i}`,
      title: `Video ${i}`,
      channelTitle: `Canal ${i}`,
      thumbnail: `t${i}`,
      publishedAt: `2024-01-0${i + 1}T00:00:00Z`,
    }));
    fixture.detectChanges();
    component.playlist.set({ ...basePlaylist, videos: manyVideos });
    component.loading.set(false);
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector(
      'nav[aria-label="Paginación de videos"]',
    ) as HTMLElement;
    const pageButtons = nav.querySelectorAll('button');
    const page2Button = Array.from(pageButtons).find(
      (btn) => (btn as HTMLButtonElement).textContent?.trim() === '2',
    ) as HTMLButtonElement;
    page2Button?.click();
    fixture.detectChanges();

    expect(component.page()).toBe(2);
  });

  it('should display videos in grid when playlist has videos', () => {
    component.playlist.set(basePlaylist);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Alpha');
    expect(compiled.textContent).toContain('Beta');
    expect(compiled.textContent).toContain('Gamma');
  });

  it('should show "Sin resultados" when filtered videos is empty', () => {
    component.playlist.set(basePlaylist);
    component.searchQuery.set('xyz-no-existe');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Sin resultados para esta búsqueda');
  });

  it('should show pagination when totalPages > 1', () => {
    const manyVideos: Video[] = Array.from({ length: 7 }, (_, i) => ({
      id: `v${i}`,
      title: `Video ${i}`,
      channelTitle: `Canal ${i}`,
      thumbnail: `t${i}`,
      publishedAt: `2024-01-0${i + 1}T00:00:00Z`,
    }));
    fixture.detectChanges();
    component.playlist.set({ ...basePlaylist, videos: manyVideos });
    component.loading.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('nav[aria-label="Paginación de videos"]')).toBeTruthy();
  });

  it('should hide pagination when totalPages <= 1', () => {
    component.playlist.set(basePlaylist);
    component.loading.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('nav[aria-label="Paginación de videos"]')).toBeFalsy();
  });

  it('should disable prev button on first page', () => {
    const manyVideos: Video[] = Array.from({ length: 7 }, (_, i) => ({
      id: `v${i}`,
      title: `Video ${i}`,
      channelTitle: `Canal ${i}`,
      thumbnail: `t${i}`,
      publishedAt: `2024-01-0${i + 1}T00:00:00Z`,
    }));
    fixture.detectChanges();
    component.playlist.set({ ...basePlaylist, videos: manyVideos });
    component.loading.set(false);
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector(
      'nav[aria-label="Paginación de videos"]',
    ) as HTMLElement;
    const prevButton = nav.querySelector('button') as HTMLButtonElement;
    expect(prevButton.disabled).toBe(true);
  });

  it('should disable next button on last page', () => {
    const manyVideos: Video[] = Array.from({ length: 7 }, (_, i) => ({
      id: `v${i}`,
      title: `Video ${i}`,
      channelTitle: `Canal ${i}`,
      thumbnail: `t${i}`,
      publishedAt: `2024-01-0${i + 1}T00:00:00Z`,
    }));
    fixture.detectChanges();
    component.playlist.set({ ...basePlaylist, videos: manyVideos });
    component.page.set(2);
    component.loading.set(false);
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector(
      'nav[aria-label="Paginación de videos"]',
    ) as HTMLElement;
    const buttons = nav.querySelectorAll('button');
    const nextButton = buttons[buttons.length - 1] as HTMLButtonElement;
    expect(nextButton.disabled).toBe(true);
  });

  it('should navigate to specific page on page number click', () => {
    const manyVideos: Video[] = Array.from({ length: 7 }, (_, i) => ({
      id: `v${i}`,
      title: `Video ${i}`,
      channelTitle: `Canal ${i}`,
      thumbnail: `t${i}`,
      publishedAt: `2024-01-0${i + 1}T00:00:00Z`,
    }));
    fixture.detectChanges();
    component.playlist.set({ ...basePlaylist, videos: manyVideos });
    component.loading.set(false);
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector(
      'nav[aria-label="Paginación de videos"]',
    ) as HTMLElement;
    const pageButtons = nav.querySelectorAll('button');
    const page2Button = Array.from(pageButtons).find(
      (btn) => (btn as HTMLButtonElement).textContent?.trim() === '2',
    ) as HTMLButtonElement;
    page2Button?.click();
    fixture.detectChanges();

    expect(component.page()).toBe(2);
  });

  it('should show verification details when verifyPlaylist is called', () => {
    component.playlist.set(basePlaylist);
    youtubeMock.getVerifyPlaylist = vi.fn(() => of({ diff: { allVideosDiff: diffs } })) as never;

    component.verifyPlaylist();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('VERIFICACIÓN: SE DETECTARON');
  });

  it('should display diff stats (new/removed counts)', () => {
    component.playlist.set(basePlaylist);
    component.differences.set(diffs);
    component.showDetailsVerify.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('2 VIDEOS NUEVOS');
    expect(compiled.textContent).toContain('1 VIDEOS ELIMINADOS');
  });

  it('should switch between tabs (all/new/removed)', () => {
    component.playlist.set(basePlaylist);
    component.differences.set(diffs);
    component.showDetailsVerify.set(true);
    fixture.detectChanges();

    const tabs = fixture.nativeElement.querySelectorAll('button');
    const newTab = Array.from(tabs).find((btn) =>
      (btn as HTMLButtonElement).textContent?.includes('Nuevos'),
    ) as HTMLButtonElement;
    newTab.click();
    fixture.detectChanges();

    expect(component.activeTab()).toBe('new');
  });

  it('should show empty state when no diffs match filter', () => {
    component.playlist.set(basePlaylist);
    component.differences.set([]);
    component.showDetailsVerify.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Sin resultados para esta búsqueda');
  });

  it('should show "Añadir" button for new videos', () => {
    component.playlist.set(basePlaylist);
    component.differences.set(diffs);
    component.showDetailsVerify.set(true);
    component.setTab('new');
    component.toggleSelect('v1');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Añadir');
  });

  it('should show "Eliminar" button for removed videos', () => {
    component.playlist.set(basePlaylist);
    component.differences.set(diffs);
    component.showDetailsVerify.set(true);
    component.setTab('removed');
    component.toggleSelect('v2');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Eliminar');
  });

  it('should show selected count in action button', () => {
    component.playlist.set(basePlaylist);
    component.differences.set(diffs);
    component.showDetailsVerify.set(true);
    component.toggleSelect('v1');
    component.toggleSelect('v4');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('(2)');
  });

  it('should show "Seleccionar todos" checkbox', () => {
    component.playlist.set(basePlaylist);
    component.differences.set(diffs);
    component.showDetailsVerify.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Seleccionar todos');
  });

  it('should show "Cancelar" button when videos are selected', () => {
    component.playlist.set(basePlaylist);
    component.differences.set(diffs);
    component.showDetailsVerify.set(true);
    component.toggleSelect('v1');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Cancelar');
  });

  it('should show "Nuevo" badge for new videos', () => {
    component.playlist.set(basePlaylist);
    component.differences.set(diffs);
    component.showDetailsVerify.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Nuevo');
  });

  it('should show "Eliminado" badge for removed videos', () => {
    component.playlist.set(basePlaylist);
    component.differences.set(diffs);
    component.showDetailsVerify.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Eliminado');
  });

  it('should show video thumbnail in diff list', () => {
    component.playlist.set(basePlaylist);
    component.differences.set(diffs);
    component.showDetailsVerify.set(true);
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img[alt="Alpha"]') as HTMLImageElement;
    expect(img).toBeTruthy();
  });

  it('should show video title in diff list', () => {
    component.playlist.set(basePlaylist);
    component.differences.set(diffs);
    component.showDetailsVerify.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Alpha');
  });

  it('should show channel title in diff list', () => {
    component.playlist.set(basePlaylist);
    component.differences.set(diffs);
    component.showDetailsVerify.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Canal A');
  });

  it('should show "Última Actualización" with time ago', () => {
    component.playlist.set(basePlaylist);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Última Actualización');
  });

  it('should show "Verificar" button', () => {
    component.playlist.set(basePlaylist);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Verificar');
  });

  it('should show "Eliminar" button in header', () => {
    component.playlist.set(basePlaylist);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Eliminar');
  });

  it('should show playlist description', () => {
    component.playlist.set(basePlaylist);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Descripción');
  });

  it('should show default description when playlist has no description', () => {
    fixture.detectChanges();
    component.playlist.set({ ...basePlaylist, description: '' });
    component.loading.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Sin descripción proporcionada');
  });

  it('should show "COLECCION DESTACADA" label', () => {
    component.playlist.set(basePlaylist);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('COLECCION DESTACADA');
  });

  it('should show total videos in header', () => {
    component.playlist.set(basePlaylist);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('3 VIDEOS');
  });

  it('should show search input for videos', () => {
    component.playlist.set(basePlaylist);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[placeholder="Buscar video"]') as HTMLInputElement;
    expect(input).toBeTruthy();
  });

  it('should show sort dropdown', () => {
    component.playlist.set(basePlaylist);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Fecha');
  });

  it('should show "Videos de la playlist" heading', () => {
    component.playlist.set(basePlaylist);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Videos de la playlist');
  });

  it('should show video card with title', () => {
    component.playlist.set(basePlaylist);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Alpha');
  });

  it('should show video card with channel title', () => {
    component.playlist.set(basePlaylist);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Canal A');
  });

  it('should show video thumbnail in grid', () => {
    component.playlist.set(basePlaylist);
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img[alt="Alpha"]') as HTMLImageElement;
    expect(img).toBeTruthy();
  });

  it('should show back button in diff view', () => {
    component.playlist.set(basePlaylist);
    component.showDetailsVerify.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.pi-arrow-left')).toBeTruthy();
  });

  it('should show diff search input', () => {
    component.playlist.set(basePlaylist);
    component.showDetailsVerify.set(true);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[placeholder="Buscar"]') as HTMLInputElement;
    expect(input).toBeTruthy();
  });

  it('should show "Todos" tab', () => {
    component.playlist.set(basePlaylist);
    component.showDetailsVerify.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Todos');
  });

  it('should show "Nuevos" tab with count', () => {
    component.playlist.set(basePlaylist);
    component.differences.set(diffs);
    component.showDetailsVerify.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Nuevos');
  });

  it('should show "Eliminados" tab with count', () => {
    component.playlist.set(basePlaylist);
    component.differences.set(diffs);
    component.showDetailsVerify.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Eliminados');
  });
});
