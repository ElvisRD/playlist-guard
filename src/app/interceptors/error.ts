import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Dialog } from '../services/dialog';
import { Toast } from '../services/toast';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const dialog = inject(Dialog);
  const toast = inject(Toast);

  return next(req).pipe(
    catchError((error) => {
      if (req.url.includes('/auth-url') || req.url.includes('/jsons/') || req.url.includes('/profile')) {
        return throwError(() => error);
      }

      switch (error.status) {
        case 401:
          dialog.open('unauthorized');
          break;
        case 404:
          toast.show('not-found');
          break;
        default:
          toast.show('error');
          break;
      }

      return throwError(() => error);
    }),
  );
};
