import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AllowedUser, AllowedUsersResponse, NotificationSubscription, UsersResponse } from '../../models';

@Injectable({
  providedIn: 'root',
})
export class AdminUsersService {
  private http = inject(HttpClient);
  private usersUrl = '/users';
  private allowedUsersUrl = '/notifications/admin/allowed-users';

  getUsers(page: number, limit: number, search: string): Observable<UsersResponse> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit)
      .set('search', search);
    return this.http.get<UsersResponse>(this.usersUrl, { params });
  }

  getAllowedUsers(page: number, limit: number, search: string): Observable<AllowedUsersResponse> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit)
      .set('search', search);
    return this.http.get<AllowedUsersResponse>(this.allowedUsersUrl, { params });
  }

  allowUser(userId: string, email: string, reason?: string): Observable<AllowedUser> {
    return this.http.post<AllowedUser>(this.allowedUsersUrl, { userId, email, reason });
  }

  removeAllowedUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.allowedUsersUrl}/${userId}`);
  }

  getPendingSubscriptions(): Observable<NotificationSubscription[]> {
    return this.http.get<NotificationSubscription[]>('/notifications/admin/pending');
  }

  approveSubscription(id: string): Observable<NotificationSubscription> {
    return this.http.post<NotificationSubscription>(
      `/notifications/admin/subscriptions/${id}/approve`,
      {},
    );
  }

  rejectSubscription(id: string): Observable<NotificationSubscription> {
    return this.http.post<NotificationSubscription>(
      `/notifications/admin/subscriptions/${id}/reject`,
      {},
    );
  }
}
