import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminUsersService } from './admin-users';
import { AllowedUsersResponse, NotificationSubscription, UsersResponse } from '../../models';

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminUsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getUsers sends page, limit and search params', () => {
    let result: UsersResponse | undefined;
    service.getUsers(2, 20, 'foo').subscribe((res) => (result = res));

    const req = httpMock.expectOne((r) => r.url === '/users');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('20');
    expect(req.request.params.get('search')).toBe('foo');

    req.flush({ data: [], total: 0 });
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('getAllowedUsers hits the admin allowed-users endpoint', () => {
    service.getAllowedUsers(1, 50, '').subscribe();
    const req = httpMock.expectOne((r) => r.url === '/notifications/admin/allowed-users');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], total: 0 } satisfies AllowedUsersResponse);
  });

  it('allowUser posts userId, email and reason', () => {
    service.allowUser('u1', 'a@b.com', 'motivo').subscribe();
    const req = httpMock.expectOne('/notifications/admin/allowed-users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ userId: 'u1', email: 'a@b.com', reason: 'motivo' });
    req.flush({});
  });

  it('removeAllowedUser deletes by userId', () => {
    service.removeAllowedUser('u1').subscribe();
    const req = httpMock.expectOne('/notifications/admin/allowed-users/u1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('getPendingSubscriptions gets from admin/pending', () => {
    let result: NotificationSubscription[] | undefined;
    service.getPendingSubscriptions().subscribe((res) => (result = res));
    const req = httpMock.expectOne('/notifications/admin/pending');
    expect(req.request.method).toBe('GET');
    req.flush([]);
    expect(result).toEqual([]);
  });

  it('approveSubscription posts to the approve endpoint', () => {
    service.approveSubscription('sub1').subscribe();
    const req = httpMock.expectOne('/notifications/admin/subscriptions/sub1/approve');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('rejectSubscription posts to the reject endpoint', () => {
    service.rejectSubscription('sub1').subscribe();
    const req = httpMock.expectOne('/notifications/admin/subscriptions/sub1/reject');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });
});
