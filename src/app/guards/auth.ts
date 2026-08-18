import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Google } from '../services/google';
import { map, take } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const google = inject(Google);
  const router = inject(Router);

  if (google.loading()) {
    return google.profile$.pipe(
      take(1),
      map((profile) => {
        if (profile) return true;
        return router.createUrlTree(['']);
      }),
    );
  }

  if (google.profile()) return true;
  return router.createUrlTree(['']);
};
