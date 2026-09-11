import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { Playlists } from './playlists';
import { Google } from '../../services/google';
import { Youtube } from '../../services/youtube';
import type { PlaylistSummary, Profile } from '../../models';

describe('Playlists', () => {
  let component: Playlists;
  let fixture: ComponentFixture<Playlists>;
  let router: Router;

  const summaries: PlaylistSummary[] = [
    { id: '1', title: 'A', thumbnail: 't1', totalVideos: 1, updatedAt: '2024-06-01T00:00:00Z' },
    { id: '2', title: 'B', thumbnail: 't2', totalVideos: 2, updatedAt: '2024-07-01T00:00:00Z' },
    { id: '3', title: 'C', thumbnail: 't3', totalVideos: 3, updatedAt: '2024-05-01T00:00:00Z' },
  ];

  const googleMock = {
    profile: signal<Profile | null>(null),
  } as unknown as Google;

  const youtubeMock = {
    getPlaylists: vi.fn(() => of({ playlists: summaries })),
  } as unknown as Youtube;

  beforeEach(async () => {
    vi.clearAllMocks();
    googleMock.profile.set(null);
    youtubeMock.getPlaylists = vi.fn(() => of({ playlists: summaries })) as never;

    await TestBed.configureTestingModule({
      imports: [Playlists],
      providers: [
        provideRouter([]),
        { provide: Google, useValue: googleMock },
        { provide: Youtube, useValue: youtubeMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Playlists);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not fetch playlists on init when not logged in', () => {
    fixture.detectChanges();
    expect(youtubeMock.getPlaylists).not.toHaveBeenCalled();
  });

  it('should fetch playlists on init when logged in', () => {
    googleMock.profile.set({ email: 'a@example.com', name: 'A', picture: 'x' });
    fixture.detectChanges();
    expect(youtubeMock.getPlaylists).toHaveBeenCalledTimes(1);
    expect(component.playlists()).toEqual(summaries);
    expect(component.playlistsLoading()).toBe(false);
  });

  it('should keep loading false on error', () => {
    youtubeMock.getPlaylists = vi.fn(() => throwError(() => new Error('Error'))) as never;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    component.getPlaylists();
    expect(errorSpy).toHaveBeenCalled();
    expect(component.playlistsLoading()).toBe(false);
    errorSpy.mockRestore();
  });

  it('should sort by date descending by default', () => {
    component.playlists.set(summaries);
    expect(component.filteredPlaylist().map((p) => p.id)).toEqual(['2', '1', '3']);
  });

  it('should sort ascending by title', () => {
    component.playlists.set(summaries);
    component.selectFilter.set('ascendente');
    expect(component.filteredPlaylist().map((p) => p.id)).toEqual(['1', '2', '3']);
  });

  it('should sort descending by title', () => {
    component.playlists.set(summaries);
    component.selectFilter.set('descendente');
    expect(component.filteredPlaylist().map((p) => p.id)).toEqual(['3', '2', '1']);
  });

  it('should filter playlists by search query', () => {
    component.playlists.set(summaries);
    component.searchQuery.set('b');
    expect(component.filteredPlaylist().map((p) => p.title)).toEqual(['B']);
  });

  it('should ignore case when filtering', () => {
    component.playlists.set(summaries);
    component.searchQuery.set('A');
    expect(component.filteredPlaylist().map((p) => p.title)).toEqual(['A']);
  });

  it('should update the query on input', () => {
    component.filterName({ target: { value: 'abc' } } as unknown as Event);
    expect(component.searchQuery()).toBe('abc');
  });

  it('should update the filter on selection', () => {
    component.seleccionar('descendente');
    expect(component.selectFilter()).toBe('descendente');
  });

  it('should navigate home when creating a new playlist', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.newPlaylist();
    expect(navigateSpy).toHaveBeenCalledWith(['']);
  });

  it('should navigate to the playlist detail', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.openPlaylist('PL1');
    expect(navigateSpy).toHaveBeenCalledWith(['/playlist/', 'PL1']);
  });

  it('should render the fetched playlists', async () => {
    googleMock.profile.set({ email: 'a@example.com', name: 'A', picture: 'x' });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('A');
    expect(compiled.textContent).toContain('B');
    expect(compiled.textContent).toContain('C');
  });
});
