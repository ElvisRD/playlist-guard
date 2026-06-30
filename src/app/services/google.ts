import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class Google {
  private apiUrl = 'http://localhost:3000/google-auth/';
  private profileSource = new BehaviorSubject<any>(null);
  profile$ = this.profileSource.asObservable();

  constructor(private http: HttpClient) {
    this.loadProfile();
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
    ).subscribe()
  }  

  cleanProfile(){
    this.profileSource.next(null);
  }

  private openAuthPopup(url: string): Observable<any> {
    return new Observable<any>((observer) => {
      const w = 500;
      const h = 600;
      const left = (window.screen.width - w) / 2;
      const top = (window.screen.height - h) / 2;

      const authWindow = window.open(
        url,
        'GoogleAuth',
        `width=${w},height=${h},left=${left},top=${top}`,
      );

      if (!authWindow) {
        observer.error(
          new Error('El navegador bloqueó el popup. Permite las ventanas emergentes.'),
        );
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'auth_complete') {
          window.removeEventListener('message', handleMessage);
          observer.next(event.data);
          observer.complete();
        }
      };

      window.addEventListener('message', handleMessage);

      return () => {
        window.removeEventListener('message', handleMessage);
      };
    });
  }
}
