import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Google {
  
  private apiUrl = 'http://localhost:3000/google-auth/';

  constructor(
    private http: HttpClient
  ) {}

  authenticateUser(): Observable<any> {
    return this.http.get(this.apiUrl + 'auth-url');
  }
}
