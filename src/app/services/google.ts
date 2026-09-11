import { Injectable, PLATFORM_ID, inject, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, timer } from 'rxjs';
import { catchError, filter, switchMap, take, tap, timeout } from 'rxjs/operators';
import { Profile, AuthUrlResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class Google {
  private apiUrl = '/google-auth/';
  private profileSource = new BehaviorSubject<Profile | null>(null);
  profile$ = this.profileSource.asObservable();
  private platformId = inject(PLATFORM_ID);
  loading = signal(true);
  profile = signal<Profile | null>(null);

  constructor(private http: HttpClient) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadProfile();
    }
  }

  authenticateUser(): Observable<AuthUrlResponse> {
    return this.http.get<AuthUrlResponse>(`${this.apiUrl}auth-url`);
  }

  authenticateWithGoogle(): Observable<Profile> {
    return this.authenticateUser().pipe(switchMap((res) => this.openAuthPopup(res.url)));
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
        complete: () => this.loading.set(false),
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

  private openAuthPopup(url: string): Observable<Profile> {
    return new Observable<Profile>((observer) => {
      if (!url.startsWith('https://accounts.google.com/')) {
        observer.error(new Error('Invalid auth URL'));
        return;
      }

      const w = 500;
      const h = 600;
      const left = (window.screen.width - w) / 2;
      const top = (window.screen.height - h) / 2;

      const popup = window.open(
        url,
        'GoogleAuth',
        `width=${w},height=${h},left=${left},top=${top}`,
      );

      if (!popup) {
        observer.error(new Error('Popup blocked by browser'));
        return;
      }

      const pollSub = timer(0, 2000)
        .pipe(
          switchMap(() => this.getProfile().pipe(catchError(() => of(null)))),
          filter((profile): profile is Profile => !!profile),
          take(1),
          timeout(120_000),
        )
        .subscribe({
          next: (profile) => {
            this.profileSource.next(profile);
            this.profile.set(profile);
            observer.next(profile);
            observer.complete();
          },
          error: (err) => observer.error(err),
        });

      return () => {
        pollSub.unsubscribe();
      };
    });
  }
}
