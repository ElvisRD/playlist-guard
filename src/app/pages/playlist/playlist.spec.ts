import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { Playlist } from './playlist';
import type { Playlist as PlaylistModel, Profile, Video, VideoDiff } from '../../models';
import { Google } from '../../services/google';
import { Youtube } from '../../services/youtube';
import { Dialog } from '../../services/dialog';
import { Toast } from '../../services/toast';

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
    expect(component.error).toBe('Error al cargar la playlist');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('should return an empty time ago without a playlist', () => {
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
});
