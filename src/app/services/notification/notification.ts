import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotificationSubscription, SubscribeRequest } from '../../models';

@Injectable({
  providedIn: 'root',
})
export class Notification {
  private http = inject(HttpClient);
  private apiUrl = '/notifications';

  subscription = signal<NotificationSubscription | null>(null);
  loading = signal(false);

  subscribe(email: string, playlistIds?: string[]): Observable<NotificationSubscription> {
    const body: SubscribeRequest = { email, playlistIds };
    return this.http.post<NotificationSubscription>(`${this.apiUrl}/subscribe`, body);
  }

  unsubscribe(subscriptionId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${subscriptionId}`);
  }

  getStatus(): Observable<NotificationSubscription | null> {
    return this.http.get<NotificationSubscription | null>(`${this.apiUrl}/status`);
  }

  sendTestEmail(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/test`, {});
  }
}
