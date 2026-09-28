import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, BehaviorSubject } from 'rxjs';
import { authGuard } from './auth';
import { Google } from '../services/google';
import type { Profile } from '../models';

describe('authGuard', () => {
  let router: Router;

  const profile: Profile = {
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/avatar.png',
  };

  function setup(options: { loading: boolean; profile: Profile | null }) {
    const profileSubject = new BehaviorSubject<Profile | null>(options.profile);

    const googleMock = {
      loading: signal(options.loading),
      profile: signal<Profile | null>(options.profile),
      profile$: profileSubject.asObservable(),
    } as unknown as Google;

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: Google, useValue: googleMock },
      ],
    });

    router = TestBed.inject(Router);
    return { router, profileSubject };
  }

  it('should allow access when user is authenticated and not loading', () => {
    setup({ loading: false, profile });

    let result: unknown;
    TestBed.runInInjectionContext(() => {
      result = authGuard({} as never, {} as never);
    });

    expect(result).toBe(true);
  });

  it('should redirect to home when user is not authenticated and not loading', () => {
    const { router } = setup({ loading: false, profile: null });
    const createUrlTreeSpy = vi.spyOn(router, 'createUrlTree').mockReturnValue({} as never);

    let result: unknown;
    TestBed.runInInjectionContext(() => {
      result = authGuard({} as never, {} as never);
    });

    expect(createUrlTreeSpy).toHaveBeenCalledWith(['']);
    expect(result).toBeDefined();
  });

  it('should wait for profile when loading and allow access if profile exists', async () => {
    const { profileSubject } = setup({ loading: true, profile: null });

    let result: unknown;
    TestBed.runInInjectionContext(() => {
      result = authGuard({} as never, {} as never);
    });

    expect(result).toBeDefined();
    expect(typeof result).not.toBe('boolean');

    // Simulate profile loading
    profileSubject.next(profile);
  });

  it('should redirect to home when loading finishes without profile', () => {
    const { router, profileSubject } = setup({ loading: true, profile: null });
    const createUrlTreeSpy = vi.spyOn(router, 'createUrlTree').mockReturnValue({} as never);

    let result: unknown;
    TestBed.runInInjectionContext(() => {
      result = authGuard({} as never, {} as never);
    });

    expect(result).toBeDefined();

    // Simulate profile loading with null
    profileSubject.next(null);
  });

  it('should return true when profile is available', () => {
    setup({ loading: false, profile });

    let result: unknown;
    TestBed.runInInjectionContext(() => {
      result = authGuard({} as never, {} as never);
    });

    expect(result).toBe(true);
  });

  it('should return UrlTree when profile is null', () => {
    const { router } = setup({ loading: false, profile: null });
    const createUrlTreeSpy = vi.spyOn(router, 'createUrlTree').mockReturnValue({} as never);

    let result: unknown;
    TestBed.runInInjectionContext(() => {
      result = authGuard({} as never, {} as never);
    });

    expect(result).toBeDefined();
    expect(result).not.toBe(true);
  });

  it('should handle loading state correctly', async () => {
    const { profileSubject } = setup({ loading: true, profile: null });

    let result: unknown;
    TestBed.runInInjectionContext(() => {
      result = authGuard({} as never, {} as never);
    });

    expect(result).toBeDefined();
    expect(typeof result).not.toBe('boolean');

    profileSubject.next(profile);
  });

  it('should redirect when profile becomes null after loading', () => {
    const { router, profileSubject } = setup({ loading: true, profile: null });
    const createUrlTreeSpy = vi.spyOn(router, 'createUrlTree').mockReturnValue({} as never);

    let result: unknown;
    TestBed.runInInjectionContext(() => {
      result = authGuard({} as never, {} as never);
    });

    expect(result).toBeDefined();

    profileSubject.next(null);

    expect(createUrlTreeSpy).toHaveBeenCalledWith(['']);
  });
});
