import { Injectable, PLATFORM_ID, inject, signal, InjectionToken, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { Profile } from '../models';

export const GOOGLE_CLIENT_ID = new InjectionToken<string>('GOOGLE_CLIENT_ID');

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GIS_SCOPES = 'openid email profile';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient(config: {
            client_id: string;
            scope: string;
            ux_mode: 'popup';
            callback: (response: { code?: string; error?: string }) => void;
            error_callback: (response: {
              type: 'popup_failed_to_open' | 'popup_closed' | 'unknown';
            }) => void;
          }): { requestCode(): void };
        };
      };
    };
  }
}

@Injectable({
  providedIn: 'root',
})
export class Google {
  private apiUrl = '/google-auth/';
  private profileSource = new BehaviorSubject<Profile | null>(null);
  profile$ = this.profileSource.asObservable();
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private clientId = inject(GOOGLE_CLIENT_ID, { optional: true }) ?? '';
  private gisScriptPromise: Promise<void> | undefined;
  loading = signal(true);
  profile = signal<Profile | null>(null);

  constructor(private http: HttpClient) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadProfile();
    }
  }

  private loadGisScript(): Promise<void> {
    if (isPlatformBrowser(this.platformId) && window.google?.accounts?.oauth2) {
      return Promise.resolve();
    }
    if (this.gisScriptPromise) {
      return this.gisScriptPromise;
    }
    this.gisScriptPromise = new Promise<void>((resolve, reject) => {
      if (!isPlatformBrowser(this.platformId)) {
        reject(new Error('Google Identity Services requires a browser'));
        return;
      }
      const script = document.createElement('script');
      script.src = GIS_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services'));
      document.head.appendChild(script);
    });
    return this.gisScriptPromise;
  }

  authenticateWithGoogle(): Observable<Profile> {
    return new Observable<Profile>((observer) => {
      if (!isPlatformBrowser(this.platformId)) {
        observer.error(new Error('Google sign-in requires a browser'));
        return;
      }
      if (!this.clientId) {
        observer.error(new Error('GOOGLE_CLIENT_ID is not configured'));
        return;
      }

      const sendCode = (code: string) => {
        this.http
          .post(`${this.apiUrl}code`, { code })
          .pipe(
            switchMap(() => this.http.get<Profile>(`${this.apiUrl}profile`)),
            tap((profile) => {
              this.profileSource.next(profile);
              this.profile.set(profile);
            }),
          )
          .subscribe({
            next: (profile) => {
              observer.next(profile);
              observer.complete();
            },
            error: (err) => observer.error(err),
          });
      };

      this.loadGisScript()
        .then(() => {
          const client = window.google!.accounts.oauth2.initCodeClient({
            client_id: this.clientId,
            scope: GIS_SCOPES,
            ux_mode: 'popup',
            callback: (response) => {
              if (response.error) {
                observer.error(new Error(`Google auth error: ${response.error}`));
                return;
              }
              if (response.code) {
                this.ngZone.run(() => sendCode(response.code!));
                return;
              }
              observer.error(new Error('Google no devolvió un código de autorización'));
            },
            error_callback: (errorResponse) => {
              const message =
                errorResponse.type === 'popup_closed'
                  ? 'Google sign-in popup was closed'
                  : errorResponse.type === 'popup_failed_to_open'
                    ? 'Google sign-in popup could not be opened'
                    : 'Google sign-in failed';
              observer.error(new Error(message));
            },
          });
          client.requestCode();
        })
        .catch((err) => observer.error(err));
    });
  }

  getProfile(): Observable<Profile> {
    return this.http.get<Profile>(`${this.apiUrl}profile`);
  }

  loadProfile() {
    this.http
      .get<Profile>(`${this.apiUrl}profile`)
      .pipe(
        tap((profile) => {
          this.profileSource.next(profile);
          this.profile.set(profile);
        }),
        catchError(() => {
          this.profileSource.next(null);
          this.profile.set(null);
          return of(null);
        }),
      )
      .subscribe({
        complete: () => {
          this.loading.set(false);
        },
      });
  }

  cleanProfile() {
    this.profileSource.next(null);
    this.profile.set(null);
  }

  logout(): Observable<unknown> {
    return this.http.get(`${this.apiUrl}logout`).pipe(
      tap(() => this.cleanProfile()),
      catchError((err) => {
        this.cleanProfile();
        return of(err);
      }),
    );
  }
}
