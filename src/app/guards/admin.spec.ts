import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { adminGuard } from './admin';
import { AuthService } from '../services/auth/auth';
import type { Profile } from '../models';

describe('adminGuard', () => {
  function setup(profileResult: Profile | Error) {
    const authMock = {
      getProfile: vi
        .fn()
        .mockReturnValue(
          profileResult instanceof Error
            ? throwError(() => profileResult)
            : of(profileResult),
        ),
    } as unknown as AuthService;

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authMock }],
    });
  }

  function runGuard(): unknown {
    let result: unknown;
    TestBed.runInInjectionContext(() => {
      const res = adminGuard({} as never, {} as never);
      (res as import('rxjs').Observable<unknown>).subscribe((r) => (result = r));
    });
    return result;
  }

  it('allows access when profile.isAdmin is true', () => {
    setup({ email: 'a@b.com', name: 'A', picture: '', isAdmin: true });
    expect(runGuard()).toBe(true);
  });

  it('redirects to / when profile.isAdmin is false', () => {
    setup({ email: 'a@b.com', name: 'A', picture: '', isAdmin: false });
    const router = TestBed.inject(Router);
    expect(runGuard()).toEqual(router.createUrlTree(['/']));
  });

  it('redirects to / when getProfile fails', () => {
    setup(new Error('401'));
    const router = TestBed.inject(Router);
    expect(runGuard()).toEqual(router.createUrlTree(['/']));
  });
});
