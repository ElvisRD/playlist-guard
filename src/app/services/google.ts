import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of, fromEvent, timeout } from 'rxjs';
import { switchMap, filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class Google {
  private apiUrl = '/google-auth/';
  private profileSource = new BehaviorSubject<any>(null);
  profile$ = this.profileSource.asObservable();
  private platformId = inject(PLATFORM_ID);
  loading = signal(true);

  constructor(private http: HttpClient) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadProfile();
    }
  }

  authenticateUser(): Observable<any> {
    return this.http.get(this.apiUrl + 'auth-url');
  }

  authenticateWithGoogle(): Observable<any> {
    return this.authenticateUser().pipe(switchMap((res: any) => this.openAuthPopup(res.url)));
  }

  getProfile(): Observable<any> {
    return this.http.get(this.apiUrl + 'profile', { withCredentials: true });
  }

  loadProfile(){
    this.http.get(this.apiUrl + 'profile', { withCredentials: true }).pipe(
      tap(profile => this.profileSource.next(profile)),
      catchError(() => {
        this.profileSource.next(null);
        return of(null);
      })
    ).subscribe({
      complete: () => this.loading.set(false)
    })
  }  

  cleanProfile(){
    this.profileSource.next(null);
  }

  logout(): Observable<any> {
    return this.http.get(this.apiUrl + 'logout', { withCredentials: true }).pipe(
      tap(() => this.cleanProfile()),
      catchError((err) => {
        this.cleanProfile();
        return of(err);
      })
    );
  }

  private openAuthPopup(url: string): Observable<any> {
    return new Observable<any>((observer) => {
      const w = 500;
      const h = 600;
      const left = (window.screen.width - w) / 2;
      const top = (window.screen.height - h) / 2;

      const popup = window.open(
        url,
        'GoogleAuth',
        `width=${w},height=${h},left=${left},top=${top}`,
      );

      const messageSub = fromEvent<MessageEvent>(window, 'message')
        .pipe(
          filter(
            (event) =>
              event.data?.type === 'auth-success' &&
              event.origin === window.location.origin,
          ),
          timeout({ first: 120_000 }),
          switchMap(() => this.getProfile()),
        )
        .subscribe({
          next: (profile) => {
            this.profileSource.next(profile);
            observer.next(profile);
            observer.complete();
          },
          error: (err) => observer.error(err),
        });

      return () => {
        messageSub.unsubscribe();
      };
    });
  }
}
