import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class Google {
  private apiUrl = 'http://localhost:3000/google-auth/';

  constructor(private http: HttpClient) {}

  authenticateUser(): Observable<any> {
    return this.http.get(this.apiUrl + 'auth-url');
  }

  authenticateWithGoogle(): Observable<any> {
    return this.authenticateUser().pipe(switchMap((res: any) => this.openAuthPopup(res.url)));
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
        if (event.data?.payload?.access_token) {
          window.removeEventListener('message', handleMessage);

          observer.next(event.data.payload);
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
