import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { authGuard } from './auth';
import { Google } from '../services/google';
import { Profile } from '../models';

describe('authGuard', () => {
  let router: Router;
  let profile$: BehaviorSubject<Profile | null>;

  function setup(loading: boolean, profile: Profile | null) {
    profile$ = new BehaviorSubject<Profile | null>(profile);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: Google,
          useValue: {
            loading: () => loading,
            profile: () => profile,
            profile$: profile$.asObservable(),
          } as unknown as Google,
        },
      ],
    });
    router = TestBed.inject(Router);
  }

  function runGuard(): unknown {
    return TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
  }

  it('should allow access when not loading and profile exists', () => {
    setup(false, { email: 'a@example.com', name: 'A', picture: 'x' });
    expect(runGuard()).toBe(true);
  });

  it('should redirect to home when not loading and no profile', () => {
    setup(false, null);
    const result = runGuard();
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toEqual(
      router.serializeUrl(router.createUrlTree([''])),
    );
  });

  it('should allow access once loading finishes with a profile', () => {
    setup(true, null);
    profile$.next({ email: 'b@example.com', name: 'B', picture: 'y' });

    let emitted: unknown;
    (runGuard() as Observable<boolean | UrlTree>).subscribe((value) => (emitted = value));
    expect(emitted).toBe(true);
    expect(runGuard()).toBeInstanceOf(Observable);
  });

  it('should redirect to home once loading finishes without a profile', () => {
    setup(true, null);

    let emitted: unknown;
    (runGuard() as Observable<boolean | UrlTree>).subscribe((value) => (emitted = value));
    expect(emitted).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(emitted as UrlTree)).toEqual(
      router.serializeUrl(router.createUrlTree([''])),
    );
  });
});
